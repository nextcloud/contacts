<?php

/**
 * SPDX-FileCopyrightText: 2017-2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2015-2016 ownCloud, Inc.
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
?>
<div class="emptycontent" style="
	min-height: 5vw;
	width: 100%;
	max-width: 700px;
	margin-block: 10vh auto;
	margin-inline: auto;
	background-color: var(--color-main-background-blur);
	color: var(--color-main-text);
	padding: calc(3 * var(--default-grid-baseline));
	border-radius: var(--border-radius-container);
	">
    <div>
        <h2>Error</h2>
        <p style="margin-bottom: 5vh;">
            <?php echo $_['message']; ?>
        </p>
    </div>
</div>
