#!/usr/bin/env ruby

# * build up a list of tests; tests are files under 'tests/**' that match '<name>Spec.js'
#
# * for each test...
#   * create a test page (called <name>Test.html) in the same directory as the spec
#     (use the template 'tests/SingleTest.html.erb' as the basis)
#
# * create a master test page (called 'tests/AllTests.html', using 'tests/AllTests.html.erb' as the basis)
#
# * start a WEBrick server for the app, and run Selenium (with a headless browser) against each page


# COPY THIS FILE TO <project>/bin to use it

require File.expand_path('../../lib/js_tests',File.dirname(__FILE__))

$basedir = File.dirname(File.dirname(File.absolute_path(__FILE__)))

if __FILE__ == $0
  options = parse_options()
  options[:theme] = 'theme-neptune'
  Dir.chdir($basedir)
  
  find_tests()
  refresh_test_pages(options) if options[:refresh]
  run_tests(options) unless options[:skip]
end
