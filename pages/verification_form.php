<?php


namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $this */

?>
<link rel="stylesheet" type="text/css" href="<?php echo $this->getUrl('asset/css/verification_form.css', false,true) ?>">
<script src="<?php echo $this->getUrl('asset/js/verification_form.js', false, true) ?>"></script>
<script>
    Form.ajaxURL = "<?php echo $this->getUrl('ajax/verify.php', false, true) ?>"
</script>
