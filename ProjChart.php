<?php
namespace Stanford\ProjChart;

require_once "emLoggerTrait.php";

class ProjChart extends \ExternalModules\AbstractExternalModule {

    use emLoggerTrait;

    public $msgDatabasePid;
    // public $newuniq;
    // public $zipcode_abs;
    // public $disposition_date;
    // public $disposition_status;


    public function __construct() {
		parent::__construct();
		// Other code to run when object is instantiated
	}


	public function loadSettings() {
        $this->msgDatabasePid = $this->getProjectSetting('msg-database-pid');
    }

    public function validateAccess($id, $zip) {
        $this->msgDatabasePid = $this->getProjectSetting('msg-database-pid');



    }




}
