/**
 * @copyright Copyright (c) 2020 Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @author Matthias Heinisch <nextcloud@matthiasheinisch.de>
 *
 * @license GNU AGPL version 3 or any later version
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
// FIXME: this does not work?
// import {generateUrl} from '@nextcloud/router';

/**
 * Updates the AllowSocialSync flag in appconfig
 */
function setAllowSocialSync(val) {
    //const url = generateUrl('/api/v1/config/apps/contacts/allowSocialSync');
    const url = '/apps/contacts/api/v1/social/config/allowSocialSync';
    const req = {
        allow: val
    };
    $.ajax({
        type: 'POST',
        url: url,
        data: req,
        async: true
    });
}

/**
 * Monitors the AllowSocialSync settings checkbox
 */
$(document).ready(function() {
    $('body').on('change', 'input#allowSocialSync', function() {
        setAllowSocialSync($(this).is(':checked') ? 'yes' : 'no');
    });
});
