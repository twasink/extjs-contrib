Creating Jasmine Tests for ExtJS
================================

This directory contains support files for creating Jasmine-based JavaScript tests for ExtJS code. These tests are designed for ExtJS 6, but do not require much tweaking to work with ExtJS 5 or Exts 4.

Download Jasmine
----------------

You'll need to download Jasmine yourself. These scripts are designed for [Jasmine 2.3.4][jasmine], with an option for using [Jasmine2-Junit][jasmine2-junit], in conjunction with Selenium, to run the tests automatically and produce JUnit-style reports. For good measure, I also use [jasmine-ajax][jasmine-ajax], because I like to test my server-calls.

You'll then need to apply the `patch_jasmine_for_extjs.patch` file, to tweak Jasmine to be a little bit friendly with ExtJS. The patch prevents Jasmine from running immediately on load (giving ExtJS a chance to get ready), and provides a pretty-print for test differences that doesn't try to go recursively down the object tree.

Copy the test script to your app
--------------------------------

You'll also need to copy the `run_js_tests.rb` script to the `bin` directory of your application.

Tweak project paths
-------------------

The test scripts assume a workspace layout like this:

+ ext
+ jasmine-2.3.4
  - jasmine-ajax-3.2.0
  - jasmine2-junit
+ lib
+ _your app_
  - app
  - bin
  - tests

If this doesn't match your layout, you can tweak the `SingleTest.html.erb` file accordingly.

Running Tests
=============

Run the `<your app>\bin\run_js_tests.rb` script to run your tests. By default, this will use Selenium to drive FireFox over your test pages. Some relevant options to include are:
  
* `-r` (or `--refresh`) will rebuild the HTML test pages from the test files. This is on by default
* `-s` (or `--skip`) will not run the tests in Selenium
* `-u` (or `--ugly`) will exclude links to the stylesheets; this makes the selenium tests run faster.

So, in general, if you want to test manually, use `<your app>\bin\run_js_tests.rb -rs` and if you want to test using Selenium use `<your app>\bin\run_js_tests.rb -ru`

Writing Tests
=============

To create a unit test, you create a file called `<class name>Spec.js`, in a similar layout to the corresponding ExtJS class. E.g. to test `MyApp.view.MyView`, located in `myapp/app/view/MyView.js`, you'd have a test file at `myapp/tests/view/MyViewSpec.js`

The test spec is a standard Jasmine test file. It will be loaded in when the page is loaded, but will not be executed until the application is ready. Importantly, this means that ExtJS will not be ready for use when the `describe` blocks of your tests are running, but _will_ be available when the `it` blocks run (as well as the `before/after/Each/All` blocks).

You can add ExtJS requirements to your test by using the `require` function before your first describe blocks. You can also load arbitary files by adding `/*@require <path/url to resource */` - though this requires refreshing the test to pick up changes.

When you want to run a test manually, simply refresh the test page, and then browse to the test page. Assuming you are using `sencha app watch` to give you a web server, then you can find the master list of tests at `http://localhost:1841/<app_name>/tests/AllTests.html`

Example Test Page
=================

```javascript
require('MyApp.view.MyView');
describe('MyApp.view.MyViewSpec', function() {
  var test = null;
  beforeAll(function() {
    test = Ext.create({'MyApp.view.MyView', {
      width: 600,
      height: 400,
      renderTo: '#main'
    }})
    test.show();
  })
  it("should be visible", function() {
    expect(test.isVisible()).toBeTruthy();
  })
})
```

[jasmine]: https://github.com/jasmine/jasmine/releases/tag/v2.3.4 "Jasmine 2.3.4 Download"
[jasmine2-junit]: https://github.com/sandermak/jasmine2-junit "Jasmine2-JUnit Download"
[jasmine-ajax]: https://github.com/jasmine/jasmine-ajax/releases/tag/v3.2.0 "Jasmine-Ajax Download"