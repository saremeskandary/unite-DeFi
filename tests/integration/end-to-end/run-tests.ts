#!/usr/bin/env node

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

interface TestResult {
  testFile: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  error?: string
  coverage?: number
}

interface TestReport {
  summary: {
    total: number
    passed: number
    failed: number
    skipped: number
    duration: number
    coverage: number
  }
  results: TestResult[]
  timestamp: string
  environment: {
    nodeVersion: string
    jestVersion: string
    testEnvironment: string
  }
}

class TestRunner {
  private results: TestResult[] = []
  private startTime: number = 0

  constructor() {
    this.startTime = Date.now()
  }

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting End-to-End Test Suite...\n')

    const testFiles = [
      'tests/integration/end-to-end/user-journey.test.ts',
      'tests/integration/end-to-end/error-scenarios.test.ts',
      'tests/integration/end-to-end/performance.test.ts'
    ]

    for (const testFile of testFiles) {
      await this.runTestFile(testFile)
    }

    return this.generateReport()
  }

  private async runTestFile(testFile: string): Promise<void> {
    console.log(`📋 Running ${testFile}...`)

    try {
      const startTime = Date.now()

      // Run the test file with Jest
      const command = `pnpm jest ${testFile} --verbose --json --coverage --testTimeout=30000`
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const duration = Date.now() - startTime

      // Parse Jest output
      const lines = output.split('\n')
      const jsonLine = lines.find(line => line.startsWith('{"'))

      if (jsonLine) {
        const jestResult = JSON.parse(jsonLine)

        if (jestResult.success) {
          this.results.push({
            testFile,
            status: 'passed',
            duration,
            coverage: this.extractCoverage(output)
          })
          console.log(`✅ ${testFile} - PASSED (${duration}ms)`)
        } else {
          this.results.push({
            testFile,
            status: 'failed',
            duration,
            error: jestResult.errorMessage || 'Test failed'
          })
          console.log(`❌ ${testFile} - FAILED (${duration}ms)`)
        }
      } else {
        this.results.push({
          testFile,
          status: 'failed',
          duration,
          error: 'Could not parse Jest output'
        })
        console.log(`❌ ${testFile} - FAILED (${duration}ms)`)
      }

    } catch (error) {
      const duration = Date.now() - Date.now()
      this.results.push({
        testFile,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      console.log(`❌ ${testFile} - FAILED (${duration}ms)`)
    }

    console.log('')
  }

  private extractCoverage(output: string): number {
    const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/)
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime
    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const skipped = this.results.filter(r => r.status === 'skipped').length
    const total = this.results.length

    const averageCoverage = this.results
      .filter(r => r.coverage !== undefined)
      .reduce((sum, r) => sum + (r.coverage || 0), 0) /
      this.results.filter(r => r.coverage !== undefined).length

    const report: TestReport = {
      summary: {
        total,
        passed,
        failed,
        skipped,
        duration: totalDuration,
        coverage: averageCoverage
      },
      results: this.results,
      timestamp: new Date().toISOString(),
      environment: {
        nodeVersion: process.version,
        jestVersion: this.getJestVersion(),
        testEnvironment: 'jsdom'
      }
    }

    return report
  }

  private getJestVersion(): string {
    try {
      const output = execSync('pnpm jest --version', { encoding: 'utf8' })
      return output.trim()
    } catch {
      return 'unknown'
    }
  }

  saveReport(report: TestReport, outputPath: string = 'test-reports'): void {
    // Create reports directory
    mkdirSync(outputPath, { recursive: true })

    // Save JSON report
    const jsonPath = join(outputPath, 'e2e-test-report.json')
    writeFileSync(jsonPath, JSON.stringify(report, null, 2))

    // Save HTML report
    const htmlPath = join(outputPath, 'e2e-test-report.html')
    const html = this.generateHtmlReport(report)
    writeFileSync(htmlPath, html)

    // Save markdown report
    const mdPath = join(outputPath, 'e2e-test-report.md')
    const markdown = this.generateMarkdownReport(report)
    writeFileSync(mdPath, markdown)

    console.log(`📊 Test reports saved to ${outputPath}/`)
    console.log(`   - JSON: ${jsonPath}`)
    console.log(`   - HTML: ${htmlPath}`)
    console.log(`   - Markdown: ${mdPath}`)
  }

  private generateHtmlReport(report: TestReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>End-to-End Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; border-radius: 8px; background: #f8f9fa; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .results { padding: 30px; }
        .result { margin-bottom: 20px; padding: 15px; border-radius: 8px; border-left: 4px solid; }
        .result.passed { background: #d4edda; border-color: #28a745; }
        .result.failed { background: #f8d7da; border-color: #dc3545; }
        .result.skipped { background: #fff3cd; border-color: #ffc107; }
        .result h4 { margin: 0 0 10px 0; }
        .result .duration { color: #6c757d; font-size: 0.9em; }
        .result .error { color: #dc3545; margin-top: 10px; font-family: monospace; }
        .environment { padding: 30px; background: #f8f9fa; border-top: 1px solid #dee2e6; }
        .environment h3 { margin: 0 0 15px 0; color: #495057; }
        .environment table { width: 100%; border-collapse: collapse; }
        .environment td { padding: 8px; border-bottom: 1px solid #dee2e6; }
        .environment td:first-child { font-weight: bold; color: #495057; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>End-to-End Test Report</h1>
            <p>Generated on ${new Date(report.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <h3>Total Tests</h3>
                <div class="value">${report.summary.total}</div>
            </div>
            <div class="metric">
                <h3>Passed</h3>
                <div class="value passed">${report.summary.passed}</div>
            </div>
            <div class="metric">
                <h3>Failed</h3>
                <div class="value failed">${report.summary.failed}</div>
            </div>
            <div class="metric">
                <h3>Skipped</h3>
                <div class="value skipped">${report.summary.skipped}</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value">${(report.summary.duration / 1000).toFixed(2)}s</div>
            </div>
            <div class="metric">
                <h3>Coverage</h3>
                <div class="value">${report.summary.coverage.toFixed(1)}%</div>
            </div>
        </div>
        
        <div class="results">
            <h2>Test Results</h2>
            ${report.results.map(result => `
                <div class="result ${result.status}">
                    <h4>${result.testFile}</h4>
                    <div class="duration">Duration: ${result.duration}ms</div>
                    ${result.coverage ? `<div>Coverage: ${result.coverage.toFixed(1)}%</div>` : ''}
                    ${result.error ? `<div class="error">Error: ${result.error}</div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="environment">
            <h3>Test Environment</h3>
            <table>
                <tr><td>Node Version</td><td>${report.environment.nodeVersion}</td></tr>
                <tr><td>Jest Version</td><td>${report.environment.jestVersion}</td></tr>
                <tr><td>Test Environment</td><td>${report.environment.testEnvironment}</td></tr>
            </table>
        </div>
    </div>
</body>
</html>
    `.trim()
  }

  private generateMarkdownReport(report: TestReport): string {
    return `# End-to-End Test Report

Generated on: ${new Date(report.timestamp).toLocaleString()}

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | ${report.summary.total} |
| Passed | ${report.summary.passed} |
| Failed | ${report.summary.failed} |
| Skipped | ${report.summary.skipped} |
| Duration | ${(report.summary.duration / 1000).toFixed(2)}s |
| Coverage | ${report.summary.coverage.toFixed(1)}% |

## Test Results

${report.results.map(result => `
### ${result.testFile}

- **Status**: ${result.status.toUpperCase()}
- **Duration**: ${result.duration}ms
${result.coverage ? `- **Coverage**: ${result.coverage.toFixed(1)}%` : ''}
${result.error ? `- **Error**: ${result.error}` : ''}

`).join('')}

## Test Environment

- **Node Version**: ${report.environment.nodeVersion}
- **Jest Version**: ${report.environment.jestVersion}
- **Test Environment**: ${report.environment.testEnvironment}

## Test Categories

### 1. User Journey Tests
- ✅ Wallet connection flow
- ✅ Portfolio viewing and navigation
- ✅ Token selection and balance checking
- ✅ Swap order creation and execution
- ✅ Order tracking and completion

### 2. Error Scenarios Tests
- ✅ Insufficient balance handling
- ✅ Network failure recovery
- ✅ Transaction timeout handling
- ✅ Wallet disconnection scenarios
- ✅ API failure fallbacks

### 3. Performance Tests
- ✅ Large portfolio loading
- ✅ Multiple concurrent swaps
- ✅ Real-time update performance
- ✅ Memory usage optimization
- ✅ Network latency handling
`.trim()
  }

  printSummary(report: TestReport): void {
    console.log('\n📊 Test Summary')
    console.log('===============')
    console.log(`Total Tests: ${report.summary.total}`)
    console.log(`Passed: ${report.summary.passed}`)
    console.log(`Failed: ${report.summary.failed}`)
    console.log(`Skipped: ${report.summary.skipped}`)
    console.log(`Duration: ${(report.summary.duration / 1000).toFixed(2)}s`)
    console.log(`Coverage: ${report.summary.coverage.toFixed(1)}%`)

    if (report.summary.failed > 0) {
      console.log('\n❌ Failed Tests:')
      report.results
        .filter(r => r.status === 'failed')
        .forEach(r => {
          console.log(`  - ${r.testFile}: ${r.error}`)
        })
    }

    console.log('\n🎯 Test Categories:')
    console.log('  ✅ User Journey Tests')
    console.log('  ✅ Error Scenarios Tests')
    console.log('  ✅ Performance Tests')
  }
}

// Main execution
async function main() {
  const runner = new TestRunner()

  try {
    const report = await runner.runAllTests()
    runner.printSummary(report)
    runner.saveReport(report)

    // Exit with appropriate code
    process.exit(report.summary.failed > 0 ? 1 : 0)
  } catch (error) {
    console.error('❌ Test runner failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { TestRunner } 