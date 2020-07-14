<?php
namespace Stanford\ProjChart;
/** @var \Stanford\ProjChart\ProjChart $module */


require APP_PATH_DOCROOT . "ControlCenter/header.php";

$XML_DB_PROJECT_TEMPLATE = $module->getUrl("docs/TrackCOVID_MSGDB_2020-07-14_1101.REDCap.xml");
$XML_MP_PROJECT_TEMPLATE = $module->getUrl("docs/TrackCOVIDGeneralPop_2020-07-14_1216.REDCap.xml");
?>
<div style='margin:20px;'>

	<h3>TrackCOVID Chart Project EM Requirements</h3>
	<p>This EM will coordinate between <b>2 REDcap projects</b> to intake and track conversions of direct mail invitations for participation in TrackCOVID Chart Project.</p>
	<p>Each of the projects will need to have the <b>TrackCOVID Chart EM</b> installed.</p>
	<p>One of each of the following modes should be set for the 2 respective project's' EM configurations:</p>
	<ul>
		<li>MSG DB Project - <?php echo "<a href='$XML_DB_PROJECT_TEMPLATE'>XML project creation template</a>" ?></li>
		<li>Main Project - <?php echo "<a href='$XML_MP_PROJECT_TEMPLATE'>XML project creation template</a>" ?></li>
	</ul>

	<br>
	<br>
	
	<h4>Enabled Projects (2 Required)</h4>
	<div>
		<?php echo $module->displayEnabledProjects( array("msg_db" => $XML_DB_PROJECT_TEMPLATE, "main_project" => $XML_MP_PROJECT_TEMPLATE)  ) ?>
	</div>
	
</div>

