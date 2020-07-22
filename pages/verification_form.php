<?php


namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $this */

$code   = isset($_GET["code"]) ? filter_var($_GET["code"], FILTER_SANITIZE_STRING) : null;
$zip    = isset($_GET["zip"]) ? filter_var($_GET["zip"], FILTER_SANITIZE_NUMBER_INT) : null;

?>
<link rel="stylesheet" type="text/css"
      href="<?php echo $this->getUrl('asset/css/verification_form.css', false, true) ?>">
<style>
    #example_img {
        position:absolute;
        width:100%; height:500px;
        max-width:696px;
        left:50%; margin-left:-348px;
        top:10%;
        z-index:10;
        background:url(<?php echo $this->getUrl('asset/img/example_code.png', false, true) ?>) no-repeat;
        background-size:contain;
    }
</style>
<script src="<?php echo $this->getUrl('asset/js/verification_form.js', false, true) ?>"></script>
<script>
    Form.ajaxURL = "<?php echo $this->getUrl('ajax/verify.php', true, true) ?>"
    window.onload = function () {
        Form.init(<?php echo json_encode($code) . "," . json_encode($zip) ?>);
    }
</script>
<div class="example_code">
    <div id="example_img"></div>
</div>
