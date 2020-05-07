<?php
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

namespace OCA\Contacts\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\IL10N;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {

	protected $appName;

        /** @var IConfig */
        private $config;

        /** @var IL10N */
        private $l;

        /**
         * Admin constructor.
         *
         * @param IConfig $config
         * @param IL10N $l
         */
        public function __construct(string $AppName,
					IConfig $config,
					IL10N $l
        ) {
                $this->config = $config;
                $this->l = $l;
                $this->appName = $AppName;
        }

        /**
         * @return TemplateResponse
         */
        public function getForm() {
                $isAdminEnabled = $this->config->getAppValue($this->appName, 'allowSocialSync', 'yes');

		$parameters = ['allowSocialSync' => $isAdminEnabled];

                return new TemplateResponse($this->appName, 'adminSettings', $parameters);
        }

        /**
         * @return string the section ID, e.g. 'sharing'
         */
        public function getSection() {
                return 'groupware';
        }

        /**
         * @return int whether the form should be rather on the top or bottom of
         * the admin section. The forms are arranged in ascending order of the
         * priority values. It is required to return a value between 0 and 100.
         */
        public function getPriority() {
                return 75;
        }

}
