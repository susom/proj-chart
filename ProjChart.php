<?php
namespace Stanford\ProjChart;

use Message;
use REDCap;

require_once "emLoggerTrait.php";

class ProjChart extends \ExternalModules\AbstractExternalModule
{

    use emLoggerTrait;

    private $newuniq
    , $zipcode_abs;

    private$enabledProjects
    , $main_project_record
    , $msg_db_record
    , $instrument
    , $msg_db_project_id;

    public function __construct() {
        parent::__construct();
    }


    /**
     * Hijack the public survey page to present our custom code entry page
     */
    function redcap_survey_page_top(
        $project_id,
        $record = null,
        $instrument,
        $event_id,
        $group_id = null,
        $survey_hash,
        $response_id = null,
        $repeat_instance = 1
    ) {
        $this->delayModuleExecution();

        $redirectInstrument = $this->getProjectSetting('redirect-instrument');

        // Handle a redirect to the main project
        if ($instrument == $redirectInstrument) {
            $redirectUrlField = $this->getProjectSetting('redirect-url-field');
            $params = array(
                'records'   => $record,
                'fields'    => [$redirectUrlField]
            );
            $q = REDCap::getData($params);
            if (empty($q[$record][$event_id][$redirectUrlField])) {
                $this->emDebug("Unable to find redirect url in $redirectUrlField");
                return;
            }

            // Redirect (can't used redirect function as it has an 'exit' in it)
            echo '<script type="text/javascript">window.location.href="' .
                $q[$record][$event_id][$redirectUrlField] .
                '";</script>';
            return;
        }

        // Is this the public survey - we tell by assuming the record_id is null
        if ($record == null) {
            $this->includeFile('pages/verification_form.php');
            ob_start();
        }
    }


    function redcap_survey_complete(
        $project_id,
        $record = null,
        $instrument,
        $event_id,
        $group_id = null,
        $survey_hash,
        $response_id = null,
        $repeat_instance = 1
    ) {

        // if ($instrument == 'contact_information') {
        //     # finally redirect to main project consent form.
        //     $param = array(
        //         'return_type' => 'json',
        //         'records' => $record,
        //         'fields'    => ['consent_survey_link']
        //     );
        //
        //     $q = REDCap::getData($param);
        //
        //     $results = json_decode($q,true);
        //     $result = $results[0];
        //     $link = $result['consent_survey_link'];
        //     if (empty($link)) {
        //         $this->emError("Unable to redirect after completion of $instrument");
        //         return false;
        //     }
        //     redirect($result['consent_survey_link']);
        // }


        try {

            // Load information from the saved survey
            $param = array(
                'project_id' => $project_id,
                'event_id'   => $event_id,
                'records'    => [ $record ],
                'fields'     => [ 'newuniq','calc_disposed' ]
            );
            $results = REDCap::getData($param);
            $data = $results[$record][$event_id];

            if (!isset( $data['calc_disposed'])) {
                $this->emError("Unable to determine if record $record was disposed");
                return false;
            };

            if (!$data['calc_disposed']) {
                $this->emDebug("Record $record was not disposed at end of $instrument");
                // We don't need to do anything
                return false;
            }


            // Lets see if it was already marked as disposed in the address database
            // Check if the record was already disposed in the address db project
            $newuniq = $data['newuniq'];

            $this->emDebug("Verify if $record / $newuniq is disposed");

            if (empty($newuniq)) {
                $this->emError("Unable to find newuniq for $record");
                return false;
            }

            $addressPid = intval($this->getProjectSetting('address-db-pid'));
            $param = array(
                'project_id' => $addressPid,
                'records'   => [ $newuniq ],
                'return_format' => 'json'
            );
            $q = REDCap::getData($param);
            $results = json_decode($q,true);
            $result = $results[0];

            $this->emDebug("Loaded address", $result);

            if (!empty($result['date_claimed'])) {
                $this->emDebug("$record already claimed");
                return false;
            }

            // Update the claimed data
            $result['date_claimed'] = date("Y-m-d H:i:s");
            $result['screen_id_claimed'] = $record;

            $this->emDebug("About to update", $result);

            $r = REDCap::saveData($addressPid, 'json', json_encode(array($result)), 'overwrite');
            if (!empty($r['errors'])) {
                $this->emError("Errors Saving", $r);
                throw new \LogicException("cant save data to Codes project");
            }
            $this->emDebug("Updated disposition", $r);

        } catch (\Exception $e) {
            $this->emError($e->getMessage());
        }

        return false;
    }


    /**
     * Parses request and sets up object
     * @return bool request valid
     */
    public function parseFormInput() {
        $this->newuniq      = isset($_POST["newuniq"])      ? strtoupper(trim(filter_var($_POST["newuniq"], FILTER_SANITIZE_STRING))) : NULL;
        $this->zipcode_abs  = isset($_POST["zipcode_abs"])  ? trim(filter_var($_POST["zipcode_abs"], FILTER_SANITIZE_NUMBER_INT))     : NULL ;
        $this->parseFromQs  = isset($_POST["parseFromQs"])  ? trim(filter_var($_POST["parseFromQs"], FILTER_SANITIZE_NUMBER_INT))     : NULL ;
        $valid              = (empty($this->newuniq) || empty($this->zipcode_abs)) ? false : true;
        $this->emDebug("Incoming POST Code + Zip: ", $_POST, $valid);
        return $valid;
    }


    /**
     * Verifies the invitation newuniq and creates a new record in the screening project
     * @return bool survey url link
     */
    public function formHandler() {
        // Match INCOMING newuniq Attempt and Verify zipcode_abs , find the record in the MSG DB
        $address_data = $this->isValidEntry();

        if (!$address_data) {
            $this->emDebug("Should return error but disabling for now",
                "Error, no matching newuniq/zipcode_abs combination found");
            throw new \LogicException($this->newuniq . " and " . $this->zipcode_abs . " is Invalid or Expired");
        }

        // AT THIS POINT WE HAVE THE newuniq RECORD, IT HASNT BEEN ABUSED, IT HASNT YET BEEN CLAIMED
        // 0.  GET NEXT AVAIL ID IN SCRENING PROJECT
        $pid = $this->getProjectId();
        $next_id = $this->getNextAvailableRecordId($pid);

        // 1.  CREATE NEW RECORD, POPULATE these 2 fields
        $dest_fields = REDCap::getFieldNames();
        $data = array_intersect_key($address_data, array_flip($dest_fields));
        $data[REDCap::getRecordIdField()] = $next_id;
        $data["telephone_screen"] = $this->parseFromQs;

        $r = REDCap::saveData('json', json_encode(array($data)));
        if (!empty($r['errors'])) {
            if (is_array($r['errors'])) {
                $e = implode(",", $r['errors']);
            } else {
                $e = $r['errors'];
            }
            throw new \LogicException("cant save data to main project " . $e);
        }

        // 2.  UPDATE MSG DB record with "claimed" main record project
//        $data = array(
//            "record_id" => $address_data['record_id'],
//            "consent_rc_link" => $next_id,
//        );
//        $r = \REDCap::saveData($this->msg_db_project_id, 'json', json_encode(array($data)), 'normal');
//        if (!empty($r['errors'])) {
//            throw new \LogicException("cant save data to MSG project");
//        }

        //3.  GET PUBLIC SURVEY URL WITH FIELDS LINKED
        $instrument = $this->getProjectSetting('dest-instrument');
        $survey_link = REDCap::getSurveyLink($next_id, $instrument, $this->getFirstEventId(), $instance = 1, $pid);

        if (is_null($survey_link)) {
            throw new \LogicException("could not generate Survey link");
        }

        return $survey_link;
    }


    /**
     * GET DATA FROM PROJECT DATA TIED TO THIS EM
     * The uniqueid and zipcode must be set for hte object.
     * @return bool
     */
    public function isValidEntry() {

        $address_pid = $this->getProjectSetting('address-db-pid');

        $param = array(
            'project_id' => $address_pid,
            'records' => [ $this->newuniq ]
        );

        $results = \REDCap::getData($param);;

        foreach ($results as $record) {
            // Get rid of event id
            $result = end($record);


            $zip            = $result['zipcode_abs'];
            $date_claimed   = $result['date_claimed'];
            $screen_id      = $result["screen_id_claimed"];

            if ($zip == $this->zipcode_abs) {
                // Found a match
                if (!empty($screen_id)) {
                    $this->emDebug("This newuniq Code has already been claimed by participant $screen_id on $date_claimed");
                    return false;
                }

                $this->emDebug("Found a matching newuniq/zipcode_abs for: ", $this->newuniq, $this->zipcode_abs);
                return $result;
            }
        }

        $this->emDebug("No match found for in Codes DB for : ", $this->newuniq);
        return false;
    }


    /**
     * GET Next available RecordId in a project
     * @return bool
     */
    public function getNextAvailableRecordId($pid){
        $pro                = new \Project($pid);
        $primary_record_var = $pro->table_pk;

        $q          = \REDCap::getData($pid, 'json', null, $primary_record_var );
        $results    = json_decode($q,true);
        if(empty($results)){
            $next_id = 1;
        }else{
            $last_entry = array_pop($results);
            $next_id    = $last_entry[$primary_record_var] + 1;
        }

        return $next_id;
    }

    /**
     * Load all enabled projects with this EM
     */
    public function getEnabledProjects() {
        $enabledProjects    = array();
        $projects           = \ExternalModules\ExternalModules::getEnabledProjects($this->PREFIX);
        while($project = db_fetch_assoc($projects)){
            $pid  = $project['project_id'];
            $name = $project['name'];
            $url  = APP_PATH_WEBROOT . 'ProjectSetup/index.php?pid=' . $project['project_id'];
            $mode = $this->getProjectSetting("em-mode", $pid);

            $enabledProjects[$mode] = array(
                'pid'   => $pid,
                'name'  => $name,
                'url'   => $url,
                'mode'  => $mode
            );

            switch($mode){
                case "msg_db":
                    $this->msg_db_project_id = $pid;
                    break;

                case "main_project":
                    $this->main_project_id = $pid;
            }
        }

        return $enabledProjects;
    }

    /**
     * Print all enabled projects with this EM
     */
    public function displayEnabledProjects($creation_xml_array) {
        ?>
        <table class="table table-striped table-bordered" style="width:100%">
            <tr>
                <th>EM Mode</th>
                <th>Project ID</th>
                <th>Project Name</th>
            </tr>
            <?php
            $modes = array("msg_db", "main_project");
            foreach($modes as $mode){
                $pid    = isset($this->enabledProjects[$mode]) ? "<a target='_BLANK' href='" . $this->enabledProjects[$mode]['url'] . "'>" . $this->enabledProjects[$mode]['pid'] . "</a>" : "N/A";
                $pname  = isset($this->enabledProjects[$mode]) ?  $this->enabledProjects[$mode]['name'] : "<a href='".$creation_xml_array[$mode]."' target='_BLANK'>Create project [XML Template]</a>";
                echo "<tr>
                        <th>$mode</th>
                        <th>$pid</th>
                        <th>$pname</th>
                    </tr>";
            }
            ?>
        </table>
        <?php
        return;
    }

    /**
     * @param string $path
     */
    public function includeFile($path)
    {
        include_once $path;
    }

    /**
     * Takes a string of emails and returns a validated string of emails
     * @param $list of emails
     * @return array with true|false and result
     */
    public function parseEmailList($list)
    {
        // Handle comma-separated lists
        $emails = array_filter(array_map('trim', explode(",", $list)));
        foreach ($emails as $email) {
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                return array(false, "Invalid Email: $email");
            }
        }
        return array(true, implode(",", $emails));
    }

    public function notifyAdmins($exception)
    {
        $emails = $this->getProjectSetting('admin-emails');
        if ($emails != '') {
            $msg = new Message();
            global $Proj;
            // Parse To:
            list($success, $to) = $this->parseEmailList($emails);
            if (!$success) {
                return array("error" => $to);
            }
            if (empty($to)) {
                return array("error" => "To address is required");
            }
            $msg->setTo($to);


            // From Email:
            list($success, $from_email) = $this->parseEmailList('redcap@stanford.edu');
            if (!$success) {
                return array("error" => $from_email);
            }
            if (empty($from_email)) {
                return array("error" => "from_email address is required");
            }
            $msg->setFrom($from_email);

            // From Name:
            $msg->setFromName('REDCap Admin');
            $subject = $Proj->project['app_title'] . ' ERROR/EXCEPTION';
            $msg->setSubject($subject);

            $msg->setBody(nl2br($exception));

            $result = $msg->send();

            if ($result) {
                \REDCap::logEvent("ERROR/EXCEPTION occurred " . $exception, '', null, null);
            }
        }
    }

    /**
     * @return mixed
     */
    public function getInstrument()
    {
        return $this->instrument;
    }

    /**
     * @param mixed $instrument
     */
    public function setInstrument($instrument)
    {
        $this->instrument = $instrument;
    }


    public function generateUniqueCodeHash($newuniq)
    {
        return hash('sha256', $newuniq);
    }

    public function setUserCookie($name, $value)
    {
        #day
        setcookie($name, $value, time() + 86406);
    }
}
