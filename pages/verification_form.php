<?php


namespace Stanford\ProjChart;

/** @var \Stanford\ProjChart\ProjChart $this */

?>
<script src="<?php echo $this->getUrl('asset/js/verification_form.js') ?>"></script>
<script>
    Form.ajaxURL = "<?php echo $this->getUrl('ajax/verify.php', false, true) ?>"
    Form.redcap_csrf_token = <?php echo System::getCsrfToken() ?>
</script>