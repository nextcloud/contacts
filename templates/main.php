<?php
if (\OCP\Util::isIe()) {
	?>
<div id="app-content">
	<div class="emptycontent">
		<div class="icon-contacts"></div>
		<h2><?php p($l->t('Your web browser is out of date')); ?></h2>
		<p><?php p($l->t('This application is not compatible with Internet Explorer')); ?></p>
	</div>
</div>

<?php
} ?>
