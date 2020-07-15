<?php
namespace Stanford\ProjChart;

require_once "emLoggerTrait.php";

class ProjChart extends \ExternalModules\AbstractExternalModule {

    use emLoggerTrait;

    public $msgDatabasePid;
    private   $newuniq
            , $zipcode_abs
            , $enabledProjects
            , $main_project_record
            , $main_project_id
            , $msg_db_record
            , $msg_db_project_id;

    public function __construct() {
		parent::__construct();
        // Other code to run when object is instantiated
        if (defined(PROJECT_ID)) {
            // Get the mode of the module
            self::$MODE = $this->getProjectSetting('em-mode');
            $this->emDebug("In mode " . self::$MODE);
        }

        // LOAD UP THE COORDINATED PROJECTS
        $this->enabledProjects = $this->getEnabledProjects();
    }


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
        if (strpos($instrument, "screening_survey") > -1) {
            $this->includeFile('pages/verification_form.php');
        }
    }

    function redcap_survey_complete()
    {
        return;
    }

    /**
     * Parses request and sets up object
     * @return bool request valid
     */
    public function parseFormInput() {
        $this->emDebug("Incoming POST Code + Zip: ", $_POST);
        
        // TODO add filter VAR
        if (empty($_POST)){
            $_POST = json_decode(file_get_contents('php://input'), true);
        }

        $this->newuniq      = isset($_POST["newuniq"]) ? strtoupper(trim($_POST["newuniq"])) : NULL ;
        $this->zipcode_abs  = isset($_POST["zipcode_abs"]) ? trim($_POST["zipcode_abs"]) : NULL ;
        $valid              = (is_null($this->newuniq) || is_null($this->zipcode_abs)) ? false : true;
        return $valid;
    }

    /**
     * Verifies the invitation newuniq and marks it as used, and creates a record in the main project 
     * @return bool survey url link
     */
    public function formHandler() {
        // Match INCOMING newuniq Attempt and Verify zipcode_abs , find the record in the MSG DB 
        $address_data = $this->getTertProjectData("msg_db");
        if (!$address_data) {
            $this->emDebug("Should return error but disbaling for now",
                "Error, no matching newuniq/zipcode_abs combination found");
            throw new \LogicException("MSG record not found");
        }

        //AT THIS POINT WE HAVE THE newuniq RECORD, IT HASNT BEEN ABUSED, IT HASNT YET BEEN CLAIMED
        //0.  GET NEXT AVAIL ID IN MAIN PROJECT
        $next_id = $this->getNextAvailableRecordId($this->main_project_id);

        //1.  CREATE NEW RECORD, POPULATE these 2 fields
        $data = array(
            "record_id" => $next_id,
            "unique_code" => $this->newuniq
        );
        $r = \REDCap::saveData($this->main_project_id, 'json', json_encode(array($data)));
        if (!empty($r['errors'])) {
            throw new \LogicException("cant save data to main project");
        }

        //2.  UPDATE MSG DB record with "claimed" main record project
        $data = array(
            "record_id" => $address_data['record_id'],
            "consent_rc_link" => $next_id,
        );
        $r = \REDCap::saveData($this->msg_db_project_id, 'json', json_encode(array($data)), 'normal');
        if (!empty($r['errors'])) {
            throw new \LogicException("cant save data to MSG project");
        }

        //3.  GET PUBLIC SURVEY URL WITH FIELDS LINKED
        // $survey_link = \REDCap::getSurveyLink($record=$next_id, $instrument='invitation_questionnaire', $event_id='', $instance=1, $project_id=$this->main_project);

        return true;
    }

    /**
     * GET DATA FROM PROJECT DATA TIED TO THIS EM
     * @return bool
     */
    public function getTertProjectData($p_type) {
        foreach ($this->enabledProjects as $project_mode => $project_data) {
            $pid = $project_data["pid"];
            if($project_mode == $p_type){
                if($p_type == "msg_db") {
                    # this will have performance  issues with 60K records
//                    $filter     = "[newuniq] = '" . $this->newuniq . "'"; //AND [zipcode_abs] = '". $this->zipcode_abs ."'
//                    $q          = \REDCap::getData($pid, 'json', null , null  , null, null, false, false, false, $filter);
//                    $results    = json_decode($q,true);

                    $param = array(
                        'project_id' => $pid,
                        'return_format' => 'array',
                    );

                    $results = \REDCap::getData($param);;

                    foreach ($results as $record) {
                        $result = end($record);

                        $newuniq_record = $result["record_id"];
                        $redeemed_participant_id = $result["consent_rc_link"];

                        //VERIFIY THAT THE CODE USED MATCHES ZIPCODE OF ADDRESS FOR IT
                        if ($result['zipcode_abs'] == $this->zipcode_abs) {
                            if (!empty($redeemed_participant_id)) {
                                $this->emDebug("This newuniq Code has already been claimed by participant ",
                                    $this->redeemed_participant_id);
                                return false;
                            }

                            $this->emDebug("Found a matching newuniq/zipcode_abs for: ", $this->newuniq, $this->zipcode_abs);
                            $this->msg_code_record   = $newuniq_record;
                            return $result;
                        }
                    }

                    $this->emDebug("No match found for in MSG DB for : ", $this->newuniq );
                }
            }
        }
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
}
