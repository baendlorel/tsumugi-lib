// ==================== 类型定义 ====================
interface TestResult {
  name: string;
  time: number;
}

interface RoundResult {
  symbolTime: number;
  instanceofTime: number;
  symbolInTime: number;
}

interface StatsResult {
  avgSymbol: number;
  avgInstanceof: number;
  avgSymbolIn: number;
  minSymbol: number;
  maxSymbol: number;
  minInstanceof: number;
  maxInstanceof: number;
  minSymbolIn: number;
  maxSymbolIn: number;
  rounds: number;
  iterations: number;
}

interface TestConfig {
  name: string;
  rounds: number;
  iterations: number;
}

const SYM = Symbol('test');

// ==================== 测试类 ====================
class PerformanceTester {
  private readonly TestClass: new () => { [SYM]: boolean };
  private readonly instance: { [key: symbol]: boolean };
  private readonly nonInstance: object;

  constructor() {
    this.TestClass = class TestClass {
      [SYM]: boolean = true;
    };

    this.instance = new this.TestClass();
    this.nonInstance = {};
  }

  /**
   * 单轮测试
   */
  private runSingleRound(iterations: number): RoundResult {
    // 写法1: if (a[symbol])
    const t1 = performance.now();
    for (let i = 0; i < iterations; i++) {
      if (this.instance[SYM]) {
        // 空操作
      }
    }
    const t2 = performance.now();
    const symbolTime = t2 - t1;

    // 写法2: if (a instanceof TestClass)
    const t3 = performance.now();
    for (let i = 0; i < iterations; i++) {
      if (this.instance instanceof this.TestClass) {
        // 空操作
      }
    }
    const t4 = performance.now();
    const instanceofTime = t4 - t3;

    // 写法3: if (symbol in a)
    const t5 = performance.now();
    for (let i = 0; i < iterations; i++) {
      if (SYM in this.instance) {
        // 空操作
      }
    }
    const t6 = performance.now();
    const symbolInTime = t6 - t5;

    return { symbolTime, instanceofTime, symbolInTime };
  }

  /**
   * 多轮测试
   */
  private runMultipleRounds(rounds: number, iterations: number): StatsResult {
    const symbolTimes: number[] = [];
    const instanceofTimes: number[] = [];
    const symbolInTimes: number[] = [];

    const logInterval = Math.max(1, Math.floor(rounds / 10));

    for (let round = 1; round <= rounds; round++) {
      const result = this.runSingleRound(iterations);

      symbolTimes.push(result.symbolTime);
      instanceofTimes.push(result.instanceofTime);
      symbolInTimes.push(result.symbolInTime);

      // 每10%或最后一轮输出进度
      if (round % logInterval === 0 || round === rounds) {
        console.log(
          `  第 ${String(round).padStart(4, ' ')}/${rounds} 轮 | ` +
            `Symbol: ${result.symbolTime.toFixed(2)}ms | ` +
            `instanceof: ${result.instanceofTime.toFixed(2)}ms | ` +
            `Symbol-in: ${result.symbolInTime.toFixed(2)}ms`,
        );
      }
    }

    // 计算统计信息
    const avgSymbol = this.average(symbolTimes);
    const avgInstanceof = this.average(instanceofTimes);
    const avgSymbolIn = this.average(symbolInTimes);

    return {
      avgSymbol,
      avgInstanceof,
      avgSymbolIn,
      minSymbol: Math.min(...symbolTimes),
      maxSymbol: Math.max(...symbolTimes),
      minInstanceof: Math.min(...instanceofTimes),
      maxInstanceof: Math.max(...instanceofTimes),
      minSymbolIn: Math.min(...symbolInTimes),
      maxSymbolIn: Math.max(...symbolInTimes),
      rounds,
      iterations,
    };
  }

  /**
   * 计算平均值
   */
  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * 打印统计结果
   */
  private printStats(stats: StatsResult, label: string): void {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`  📊 ${label}`);
    console.log(`${'─'.repeat(60)}`);

    console.log(
      `\n  ① Symbol属性:     ${stats.avgSymbol.toFixed(2)}ms  ` +
        `(范围: ${stats.minSymbol.toFixed(2)} ~ ${stats.maxSymbol.toFixed(2)}ms)`,
    );
    console.log(
      `  ② instanceof:     ${stats.avgInstanceof.toFixed(2)}ms  ` +
        `(范围: ${stats.minInstanceof.toFixed(2)} ~ ${stats.maxInstanceof.toFixed(2)}ms)`,
    );
    console.log(
      `  ③ Symbol-in:      ${stats.avgSymbolIn.toFixed(2)}ms  ` +
        `(范围: ${stats.minSymbolIn.toFixed(2)} ~ ${stats.maxSymbolIn.toFixed(2)}ms)`,
    );

    // 排名
    const sorted: TestResult[] = [
      { name: 'Symbol属性', time: stats.avgSymbol },
      { name: 'instanceof', time: stats.avgInstanceof },
      { name: 'Symbol-in', time: stats.avgSymbolIn },
    ].sort((a, b) => a.time - b.time);

    console.log(`\n🏆 速度排名:`);
    sorted.forEach((item, index) => {
      const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
      const diff = sorted[0].time > 0 ? `(慢 ${((item.time / sorted[0].time - 1) * 100).toFixed(1)}%)` : '';
      console.log(`   ${emoji} ${item.name.padEnd(14, ' ')}: ${item.time.toFixed(2)}ms ${diff}`);
    });

    // 详细对比
    const diff1 = ((stats.avgSymbol - stats.avgInstanceof) / stats.avgInstanceof) * 100;
    const diff2 = ((stats.avgSymbolIn - stats.avgInstanceof) / stats.avgInstanceof) * 100;

    console.log(`\n📊 详细对比 (以 instanceof 为基准):`);
    console.log(
      `   instanceof vs Symbol属性:  ${diff1 > 0 ? 'instanceof 快' : 'Symbol 快'} ${Math.abs(diff1).toFixed(1)}%`,
    );
    console.log(
      `   instanceof vs Symbol-in:   ${diff2 > 0 ? 'instanceof 快' : 'Symbol-in 快'} ${Math.abs(diff2).toFixed(1)}%`,
    );
  }

  /**
   * 测试非实例对象
   */
  public testNonInstance(rounds: number, iterations: number): void {
    console.log(`\n\n${'═'.repeat(60)}`);
    console.log(`  🔍 非实例对象测试 | 轮数: ${rounds} | 每轮: ${iterations.toLocaleString()} 次`);
    console.log(`${'═'.repeat(60)}`);

    const symbolTimes: number[] = [];
    const instanceofTimes: number[] = [];
    const symbolInTimes: number[] = [];

    for (let round = 1; round <= rounds; round++) {
      const t1 = performance.now();
      for (let i = 0; i < iterations; i++) {
        // @ts-ignore
        if (this.nonInstance[SYM]) {
        }
      }
      const t2 = performance.now();
      symbolTimes.push(t2 - t1);

      const t3 = performance.now();
      for (let i = 0; i < iterations; i++) {
        if (this.nonInstance instanceof this.TestClass) {
        }
      }
      const t4 = performance.now();
      instanceofTimes.push(t4 - t3);

      const t5 = performance.now();
      for (let i = 0; i < iterations; i++) {
        if (SYM in this.nonInstance) {
        }
      }
      const t6 = performance.now();
      symbolInTimes.push(t6 - t5);
    }

    const avgSymbol = this.average(symbolTimes);
    const avgInstanceof = this.average(instanceofTimes);
    const avgSymbolIn = this.average(symbolInTimes);

    console.log(`\n📈 非实例对象平均耗时:`);
    console.log(`  ① Symbol属性:  ${avgSymbol.toFixed(2)}ms`);
    console.log(`  ② instanceof:  ${avgInstanceof.toFixed(2)}ms`);
    console.log(`  ③ Symbol-in:   ${avgSymbolIn.toFixed(2)}ms`);
  }

  /**
   * 运行完整测试套件
   */
  public runFullTest(): void {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║    三种写法性能对比: Symbol属性 vs instanceof vs Symbol-in   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    const configs: TestConfig[] = [
      { name: '🟢 超小规模测试', rounds: 10, iterations: 10 },
      { name: '🟡 中等规模测试', rounds: 1000, iterations: 1000 },
      { name: '🔴 大规模测试', rounds: 10, iterations: 10000000 },
    ];

    for (const config of configs) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`  📊 ${config.name} | 轮数: ${config.rounds} | 每轮: ${config.iterations.toLocaleString()} 次`);
      console.log(`${'═'.repeat(60)}`);

      const stats = this.runMultipleRounds(config.rounds, config.iterations);
      this.printStats(stats, config.name);
    }

    // 非实例测试
    this.testNonInstance(1000, 1000);

    // 终极测试
    this.runUltimateTest();
  }

  /**
   * 终极测试：单轮5000万次（预热后）
   */
  private runUltimateTest(): void {
    console.log(`\n\n${'═'.repeat(60)}`);
    console.log('  🎯 终极测试: 单轮 5000万次 (预热后)');
    console.log(`${'═'.repeat(60)}`);

    const ULTRA_ITERATIONS = 50000000;

    // 预热
    console.log('🔥 预热中...');
    for (let i = 0; i < 1000000; i++) {
      if (this.instance[SYM]) {
      }
      if (this.instance instanceof this.TestClass) {
      }
      if (SYM in this.instance) {
      }
    }
    console.log('✅ 预热完成\n');

    // 正式测试
    console.time('① Symbol属性   (5000万次)');
    for (let i = 0; i < ULTRA_ITERATIONS; i++) {
      if (this.instance[SYM]) {
      }
    }
    console.timeEnd('① Symbol属性   (5000万次)');

    console.time('② instanceof   (5000万次)');
    for (let i = 0; i < ULTRA_ITERATIONS; i++) {
      if (this.instance instanceof this.TestClass) {
      }
    }
    console.timeEnd('② instanceof   (5000万次)');

    console.time('③ Symbol-in   (5000万次)');
    for (let i = 0; i < ULTRA_ITERATIONS; i++) {
      if (SYM in this.instance) {
      }
    }
    console.timeEnd('③ Symbol-in   (5000万次)');

    console.log(`\n${'═'.repeat(60)}`);
    console.log('✅ 所有测试完成！');
    console.log('═'.repeat(60));
  }
}

// ==================== 运行测试 ====================
const tester = new PerformanceTester();
tester.runFullTest();
