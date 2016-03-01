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
require 'rubygems'

def parse_options()
  require 'optparse'

  options = { :refresh => true, :css => true, :mappings => [], :translations => [], :template => '../lib/SingleTest.html.erb' }
  OptionParser.new do |opts|
    opts.banner = "Usage: #{__FILE__} [options]"
  
    opts.on('-r', '--refresh', 'Refresh/rebuild test files [default]') { |r| options[:refresh] = true }
    opts.on('-R', '--norefresh', 'Do not refresh/rebuild test files') { |r| options[:refresh] = false }
    opts.on('-S', '--skip', 'Skip running the tests; normally used in conjunction with --refresh') { |r| options[:skip] = true }
    opts.on('-u', '--ugly', 'Disable CSS') { |r| options[:css] = false }
  end.parse!

  return options
end

def find_tests() 
  require 'find'
  
  $test_specs = []
  Find.find($basedir + '/tests') do |path|
    $test_specs << path if path.end_with? 'Spec.js'
  end
end

def refresh_test_pages(options)
  p 'Rebuilding test pages'
  
  require 'erb'
  test_page_template = ERB.new(File.new($basedir + "/" + options[:template]).read)
  all_specs = []
  
  all_includes = []
  if options[:overrides]
    all_includes += Dir.glob($basedir + '/../packages/*/src/**/*.js')
    all_includes += Dir.glob($basedir + '/../packages/*/overrides/**/*.js')
  end
  all_includes.collect! { |path| path[($basedir.length)..-1]}
  
  $test_specs.each do |spec_path|
    # look inside the spec for lines starting with // @include <foo>

    depth = (spec_path[$basedir.length..-1].count '/') - 3
    app_root = '..'
    (0..depth).each { |i| app_root << '/..' }

    include_files = all_includes.collect { |path| app_root + path }

    File.new(spec_path).each_line do | line |
      include_files << line[12..-1].strip() if line.start_with? '// @include '
    end
    
    spec_name = File.basename(spec_path)[0..-8] # Spec.js is 7 characters long
        
    create_test_page File.dirname(spec_path) + "/#{spec_name}Test.html", app_root, test_page_template, [ spec_name ], include_files, options[:css], options[:mappings], options[:translations], options[:theme]
    all_specs << spec_path[($basedir + '/tests/').length .. -8]
  end

  create_test_page "#{$basedir}/tests/AllTests.html", $basedir, ERB.new(File.new($basedir + '/../lib/AllTests.html.erb').read), all_specs, [], options[:css], options[:mappings], options[:transalations], options[:theme]
end

def create_test_page(page_name, basedir, test_page_template, spec_names, include_files, showCss, mappings, translations, theme)
  File.open(page_name, 'w') do |f|
    f.write test_page_template.result(binding)
  end
end

def run_tests(options)
  p 'Running test pages'
  base_uri = File.basename($basedir)
  port_number = 9000
  start_webrick_in_background port_number
  results = run_selenium_tests "http://localhost:#{port_number}/#{base_uri}"
  stop_webrick
  save_results results  
end

def start_webrick_in_background(port_number)
  require 'webrick'
  p "starting server"
  
  root = File.dirname($basedir) # need to use the parent dir, so we can find extjs, etc.

  log = WEBrick::Log.new(nil, WEBrick::Log::ERROR)

  $server = WEBrick::HTTPServer.new Port: port_number, DocumentRoot: root, AccessLog: [], Logger: log, DoNotReverseLookup: true
  trap 'INT' do $server.shutdown end
  
  $server_thread = Thread.new {
    $server.start
    p "server has stopped"
  }
  while ($server.status != :Running)
    p "Waiting for server startup"
    sleep(1)
  end
  p "server has started"
end

def run_selenium_tests(base_uri)
  p "running selenium tests"
  require "selenium-webdriver"
  
  driver = Selenium::WebDriver.for :firefox
  driver.manage.timeouts.implicit_wait = 20 # seconds
  driver.manage.timeouts.script_timeout = 20 # seconds
  
  results = []
  $test_specs.each do |spec_path|
    results << run_selenium_test(driver, spec_path[($basedir + '/tests/').length .. -8], base_uri)
  end
  
  driver.quit
  
  return results
end

def run_selenium_test(driver, test_name, base_uri)
  p "Running Test: " + test_name
  driver.navigate.to "#{base_uri}/tests/#{test_name}Test.html"
  duration_element = driver.find_element(:css => '.jasmine_html-reporter .duration')
  result = driver.find_element(:css => '.jasmine_html-reporter .statusbar')
  
  duration = duration_element.text().match(/finished in (.+)s/)[1]
  if (result.attribute('class').match /passed/)
    failures = []
    passing = result.text.match(/^(\d+) sp.*/)[1]
    detail = ''
  else
    passing = 0 # todo, get real passes
    failures = driver.find_elements(:css => '.jasmine_html-reporter .results .failures .spec-detail.failed')
    details = ''
    failures.each { |failure|
      description = failure.find_element(:css => '.description')
      details += "\t#{description.text}\n"

      message_text = ''
      messages = failure.find_elements(:css => '.messages .result-message')
      messages.each { |message|
        message_text += "\t\t#{message.text}\n"
      }
      details += message_text
      
    }
    # details = driver.find_element(:css => '.jasmine_html-reporter .results .failures').text
  end
  
  return { :name => test_name, :duration => duration, :failures => failures.size, :passing => passing, :details => details }
end

def save_results(results)

  failed = 0
  results.each do | result |
    if (result[:failures].to_i > 0)
      failed += 1
      puts "TESTS FAILED: #{result[:name]}"
      puts "#{result[:details]}"
    end
  end
  if (failed > 0)
    puts "#{failed} OF #{results.size} TESTS FAILED"
    exit 1
  else
    puts "#{results.size} TESTS PASSED"
  end
end

def stop_webrick
  p "stopping server"
  $server.shutdown
  while ($server.status != :Stop)
    p $server.status
    sleep(1)
  end
  
end
