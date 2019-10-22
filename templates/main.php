<?php
if (!\OCP\Util::isIe()) {
	script('contacts', 'contacts');
	style('contacts', 'contacts');
?>

<input type="hidden" id="initial-state-contacts-locales" value="<?php p(base64_encode($_['locales'])); ?>">
<input type="hidden" id="initial-state-contacts-defaultProfile" value="<?php p(base64_encode($_['defaultProfile'])); ?>">

<?php } else { ?>
<div id="app-content">
	<div class="emptycontent">
		<div class="icon-contacts-dark"></div>
		<h2><?php p($l->t('Your web browser is out of date')); ?></h2>
		<p><?php p($l->t('This application is not compatible with Internet Explorer')); ?></p>
	</div>
</div>

<?php } ?>
