<?php
namespace Stanford\ProjChart;
/** @var \Stanford\ProjChart\ProjChart $module */

require_once APP_PATH_DOCROOT . 'ProjectGeneral/header.php';

$XML_DB_PROJECT_TEMPLATE = $module->getUrl("docs/TrackCOVID_MSGDB_2020-07-14_1101.REDCap.xml");
$XML_MP_PROJECT_TEMPLATE = $module->getUrl("docs/TrackCOVIDGeneralPop_2020-07-14_1216.REDCap.xml");
?>

<div style='margin:20px;'>
    <h4>TrackCOVID Chart Project EM Requirements</h4>
    <p>This EM will coordinate between <b>2 REDcap projects</b> to intake and track conversions of direct mail invitations for participation in TrackCOVID Chart Project.</p>
    <p>Once created, all projects must have the <b>TrackCOVID Chart EM</b> installed and configured to be identified as<br> <b>[MSG DB] or [MAIN PROJECT]</b> respectively</p>

    <br>
    <br>

    <h5>Download TrackCovid Chart Project XML Templates:</h5>
    <ul>
    <li><?php echo "<a href='$XML_DB_PROJECT_TEMPLATE'>MSG DB XML project template</a>" ?></li>
    <li><?php echo "<a href='$XML_MP_PROJECT_TEMPLATE'>MAIN PROJECT XML project template</a>" ?></li>
    </ul>

    <br>
    <br>

    <h4>Enabled Projects (2 Required)</h4>
	<div>
		<?php echo $module->displayEnabledProjects( array("msg_db" => $XML_DB_PROJECT_TEMPLATE, "main_project" => $XML_MP_PROJECT_TEMPLATE)  ) ?>
	</div>
</div>