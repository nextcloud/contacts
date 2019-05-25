---
name: Bug report
about: Help us improving by reporting a bug
labels: bug, 0. Needs triage
---

<!--
Thanks for reporting issues back to Nextcloud! This is the issue tracker of Nextcloud, if you have any support question please check out https://nextcloud.com/support

To make it possible for us to help you please fill out below information carefully. 
You can also use the Issue Template application to prefill most of the required information: https://apps.nextcloud.com/apps/issuetemplate

⚠ Please report only issues corresponding to the contacts app for Nextcloud ⚠

Migration and CardDAV issues belong in the server repo!
https://github.com/nextcloud/server/issues

If you have any questions, head over to https://help.nextcloud.com/c/apps/contacts
__________________________________________________________________

Note that Nextcloud is an open source project backed by Nextcloud GmbH. Most of our volunteers are home users and thus primarily care about issues that affect home users. Our paid engineers prioritize issues of our customers. If you are neither a home user nor a customer, consider paying somebody to fix your issue, do it yourself or become a customer.
-->

### Describe the bug
A clear and concise description of what the bug is.
......
......

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
Tell us what you expected to happen.

**Actual behavior**
Tell us what happened instead.

**Screenshots**
If applicable, add screenshots to help explain your problem.

### Server configuration
<!--
You can use the Issue Template application to prefill most of the required information: https://apps.nextcloud.com/apps/issuetemplate
-->

**Operating system**: Windows, Linux, MacOS...

**Web server:** Apache, Nginx...

**Database:** MariaDB, MySQL, PostgreSQL... 

**PHP version:** 7.0, 7.1, 7.2...

**Nextcloud version:** (see Nextcloud admin page)

**Contacts version:** (see Nextcloud apps page)

**Updated from an older Nextcloud or fresh install:**

**Signing status:**
```
Login as admin user into your Nextcloud and access 
http://example.com/index.php/settings/integrity/failed 
paste the results here.
```

**List of activated apps:**
```
If you have access to your command line run e.g.:
sudo -u www-data php occ app:list
from within your Nextcloud installation folder
```

**Nextcloud configuration:**
```
If you have access to your command line run e.g.:
sudo -u www-data php occ config:list system
from within your instance's installation folder

or

Insert your config.php content here
Make sure to remove all sensitive content such as passwords. (e.g. database password, passwordsalt, secret, smtp password, …)
```

### Client configuration
**Browser:**

**Operating system:**

**CardDAV-clients:**

### Logs
#### *Web server error log*
```
Insert your webserver log here
```

### Nextcloud log
#### *data/nextcloud.log*
```
Insert your Nextcloud log here
```

#### Browser log
<details>
<summary>How to access your browser console (Click to expand)</summary>

# Chrome
- Press either CTRL + SHIFT + J to open the “console” tab of the Developer Tools.
- Alternative method:
    1. Press either CTRL + SHIFT + I or F12 to open the Developer Tools.
    2. Click the “console” tab.

# Safari
- Press CTRL + ALT + I to open the Web Inspector.
- See Chrome’s step 2. (Chrome and Safari have pretty much identical dev tools.)

# IE9
1. Press F12 to open the developer tools.
2. Click the “console” tab.

# Firefox
- Press CTRL + SHIFT + K to open the Web console (COMMAND + SHIFT + K on Macs).
- or, if Firebug is installed (recommended):
    1. Press F12 to open Firebug.
    2. Click on the “console” tab.

# Opera
1. Press CTRL + SHIFT + I to open Dragonfly.
2. Click on the “console” tab.
</details>

```
Insert your browser log here, this could for example include:

a) The javascript console log
b) The network log 
c) ...
```
