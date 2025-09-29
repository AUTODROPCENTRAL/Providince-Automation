const axios = require('axios');
const fs = require('fs').promises;
const { SocksProxyAgent } = require('socks-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');

class Providence {
    constructor() {
        this.BASE_API = "https://hub.playprovidence.io/api";
        this.proxies = [];
        this.proxyIndex = 0;
        this.accountProxies = {};
        this.headers = {};
        this.cookieHeaders = {};
        
        // Colors
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            cyan: '\x1b[36m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            white: '\x1b[37m',
            gray: '\x1b[90m',
            red: '\x1b[31m'
        };
    }

    c(color, text) {
        return `${this.colors[color]}${text}${this.colors.reset}`;
    }

    banner() {
        const banner = `
 ____  ____   _____     _______ ____  _____ *   *  ____ _____ 
|  * \\|  * \\ / * \\ \\   / /*   *|  * \\| ____| \\ | |/ ___| ____|
| |_) | |_) | | | \\ \\ / /  | | | | | |  *| |  \\| | |   |  *|  
|  __/|  * <| |*| |\\ V /   | | | |_| | |___| |\\  | |___| |___ 
|_|   |_| \\_\\\\___/  \\_/    |_| |____/|_____|_| \\_|\\____|_____|`;
        
        console.log(this.c('cyan', this.c('bright', banner)));
        console.log(this.c('gray', 'Providence Auto Bot @ByAutoDropCentral    |  ') + this.getCurrentTime());
        console.log(this.c('gray', '─'.repeat(60)));
    }

    getCurrentTime() {
        return new Date().toLocaleString('id-ID', { 
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).replace(',', ' •') + ' WIB';
    }

    formatSeconds(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    async loadProxies() {
        try {
            const data = await fs.readFile('proxy.txt', 'utf-8');
            this.proxies = data.split('\n').filter(line => line.trim());
            return this.proxies.length;
        } catch (error) {
            this.proxies = [];
            return 0;
        }
    }

    checkProxyScheme(proxy) {
        const schemes = ['http://', 'https://', 'socks4://', 'socks5://'];
        if (schemes.some(scheme => proxy.startsWith(scheme))) {
            return proxy;
        }
        return `http://${proxy}`;
    }

    getNextProxyForAccount(account) {
        if (!this.accountProxies[account]) {
            if (this.proxies.length === 0) return null;
            const proxy = this.checkProxyScheme(this.proxies[this.proxyIndex]);
            this.accountProxies[account] = proxy;
            this.proxyIndex = (this.proxyIndex + 1) % this.proxies.length;
        }
        return this.accountProxies[account];
    }

    rotateProxyForAccount(account) {
        if (this.proxies.length === 0) return null;
        const proxy = this.checkProxyScheme(this.proxies[this.proxyIndex]);
        this.accountProxies[account] = proxy;
        this.proxyIndex = (this.proxyIndex + 1) % this.proxies.length;
        return proxy;
    }

    buildProxyConfig(proxy) {
        if (!proxy) return null;
        if (proxy.startsWith('socks')) {
            return new SocksProxyAgent(proxy);
        } else if (proxy.startsWith('http')) {
            return new HttpsProxyAgent(proxy);
        }
        return null;
    }

    maskAccount(account) {
        if (account.includes('@')) {
            const [local, domain] = account.split('@');
            const masked = local.slice(0, 3) + '***' + local.slice(-3);
            return `${masked}@${domain}`;
        }
        return account;
    }

    async checkConnection(proxyUrl = null) {
        try {
            const config = {
                timeout: 30000,
                httpsAgent: this.buildProxyConfig(proxyUrl)
            };
            await axios.get('https://api.ipify.org?format=json', config);
            return true;
        } catch (error) {
            return false;
        }
    }

    async userStats(token, proxyUrl = null, retries = 5) {
        const url = `${this.BASE_API}/user/stats`;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const config = {
                    headers: {
                        ...this.headers[token],
                        'Cookie': this.cookieHeaders[token]
                    },
                    timeout: 60000,
                    httpsAgent: this.buildProxyConfig(proxyUrl)
                };
                const response = await axios.get(url, config);
                return response.data;
            } catch (error) {
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        return null;
    }

    async checkinStatus(token, proxyUrl = null, retries = 5) {
        const url = `${this.BASE_API}/daily-checkin/status`;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const config = {
                    headers: {
                        ...this.headers[token],
                        'Cookie': this.cookieHeaders[token]
                    },
                    timeout: 60000,
                    httpsAgent: this.buildProxyConfig(proxyUrl)
                };
                const response = await axios.get(url, config);
                return response.data;
            } catch (error) {
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        return null;
    }

    async claimCheckin(token, proxyUrl = null, retries = 5) {
        const url = `${this.BASE_API}/daily-checkin/checkin`;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const config = {
                    headers: {
                        ...this.headers[token],
                        'Cookie': this.cookieHeaders[token],
                        'Content-Length': '0'
                    },
                    timeout: 60000,
                    httpsAgent: this.buildProxyConfig(proxyUrl)
                };
                const response = await axios.post(url, {}, config);
                return response.data;
            } catch (error) {
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        return null;
    }

    async dailyTasks(token, proxyUrl = null, retries = 5) {
        const url = `${this.BASE_API}/quests/daily-link/today`;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const config = {
                    headers: {
                        ...this.headers[token],
                        'Cookie': this.cookieHeaders[token]
                    },
                    timeout: 60000,
                    httpsAgent: this.buildProxyConfig(proxyUrl)
                };
                const response = await axios.get(url, config);
                return response.data;
            } catch (error) {
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        return null;
    }

    async completeTasks(token, questId, proxyUrl = null, retries = 5) {
        const url = `${this.BASE_API}/quests/daily-link/complete`;
        const data = { questId };
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const config = {
                    headers: {
                        ...this.headers[token],
                        'Cookie': this.cookieHeaders[token],
                        'Content-Type': 'application/json'
                    },
                    timeout: 60000,
                    httpsAgent: this.buildProxyConfig(proxyUrl)
                };
                const response = await axios.post(url, data, config);
                return response.data;
            } catch (error) {
                if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }
            }
        }
        return null;
    }

    async processCheckConnection(token, useProxy) {
        while (true) {
            const proxy = useProxy ? this.getNextProxyForAccount(token) : null;
            const isValid = await this.checkConnection(proxy);
            if (!isValid && useProxy) {
                this.rotateProxyForAccount(token);
                continue;
            }
            return true;
        }
    }

    async processAccount(token, useProxy, accountIndex, totalAccounts) {
        const isValid = await this.processCheckConnection(token, useProxy);
        if (!isValid) return null;

        const proxy = useProxy ? this.getNextProxyForAccount(token) : null;
        const result = {
            proxy: proxy || '— none —',
            email: 'Unknown',
            level: 0,
            xp: 0,
            nextCheckin: null,
            checkinStatus: null,
            tasks: []
        };

        const stats = await this.userStats(token, proxy);
        if (stats && stats.data) {
            result.email = this.maskAccount(stats.data.user_email || 'Unknown');
            result.level = stats.data.level || 0;
            result.xp = stats.data.total_xp || 0;
        }

        const checkinStatus = await this.checkinStatus(token, proxy);
        if (checkinStatus && checkinStatus.data) {
            if (checkinStatus.data.canCheckinToday) {
                const claim = await this.claimCheckin(token, proxy);
                if (claim && claim.data) {
                    result.checkinStatus = `${this.c('green', '✅ Claimed')} ${this.c('yellow', `(+${claim.data.xpEarned} XP)`)}`;
                }
            } else {
                const nextCheckin = checkinStatus.data.nextCheckinIn;
                if (nextCheckin) {
                    const nextDate = new Date(Date.now() + nextCheckin);
                    result.nextCheckin = nextDate.toLocaleString('id-ID', { 
                        timeZone: 'Asia/Jakarta',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                        hour12: false
                    }) + ' WIB';
                    result.checkinStatus = `${this.c('gray', '⏰ Already claimed')}`;
                }
            }
        }

        const questLists = await this.dailyTasks(token, proxy);
        if (questLists && questLists.data) {
            const quests = questLists.data;
            for (const quest of quests) {
                const { id, title, xp, isCompleted } = quest;
                if (isCompleted) {
                    result.tasks.push({ title, status: this.c('gray', '✓ Completed'), xp });
                } else {
                    const complete = await this.completeTasks(token, id, proxy);
                    if (complete) {
                        result.tasks.push({ title, status: this.c('green', '✅ Completed'), xp: this.c('yellow', `+${xp} XP`) });
                    } else {
                        result.tasks.push({ title, status: this.c('red', '✗ Failed'), xp });
                    }
                }
            }
        }

        return result;
    }

    displaySummary(accountCount, proxyCount, cycleStatus, nextCycle) {
        console.log(this.c('cyan', this.c('bright', '▶ Summary')));
        console.log(this.c('gray', '  • Accounts       : ') + this.c('white', accountCount));
        console.log(this.c('gray', '  • Proxies        : ') + this.c('white', proxyCount > 0 ? `${proxyCount} (loaded)` : '— none —'));
        console.log(this.c('gray', '  • Cycle status   : ') + cycleStatus);
        if (nextCycle) {
            console.log(this.c('gray', '  • Next cycle in  : ') + this.c('yellow', nextCycle));
        }
    }

    displayAccountInfo(result, index, total) {
        console.log(this.c('cyan', this.c('bright', `▶ Current Account (${index}/${total})`)));
        console.log(this.c('gray', '  • Proxy used     : ') + this.c('blue', result.proxy));
        console.log(this.c('gray', '  • Account        : ') + this.c('white', result.email));
        console.log(this.c('gray', '  • Level / XP     : ') + this.c('white', `${result.level}  /  ${result.xp} XP`));
        console.log(this.c('gray', '  • Next check-in  : ') + this.c('white', result.nextCheckin || '— unknown —'));
        
        if (result.tasks.length > 0) {
            console.log(this.c('gray', '  • Daily tasks    :'));
            result.tasks.forEach(task => {
                console.log(this.c('gray', `    - ${task.title.padEnd(30)} : `) + task.status + ' ' + (task.xp || ''));
            });
        } else {
            console.log(this.c('gray', '  • Daily tasks    : ') + this.c('gray', '— none —'));
        }
    }

    displayActions(result) {
        console.log(this.c('cyan', this.c('bright', '▶ Actions')));
        console.log(this.c('gray', '  • Check-in status: ') + (result.checkinStatus || this.c('gray', '— unknown —')));
    }

    async main() {
        try {
            const data = await fs.readFile('token.txt', 'utf-8');
            const accounts = data.split('\n').filter(line => line.trim());

            const proxyCount = await this.loadProxies();
            const useProxy = this.proxies.length > 0;

            while (true) {
                console.clear();
                this.banner();

                this.displaySummary(accounts.length, proxyCount, this.c('yellow', '⏳ In progress'), null);
                console.log('');

                const results = [];
                for (let idx = 0; idx < accounts.length; idx++) {
                    const token = accounts[idx];
                    if (!token) continue;

                    this.cookieHeaders[token] = `__Secure-authjs.session-token=${token}`;
                    this.headers[token] = {
                        'Accept': '*/*',
                        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
                        'Origin': 'https://hub.playprovidence.io',
                        'Referer': 'https://hub.playprovidence.io/',
                        'Sec-Fetch-Dest': 'empty',
                        'Sec-Fetch-Mode': 'cors',
                        'Sec-Fetch-Site': 'same-origin',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    };

                    const result = await this.processAccount(token, useProxy, idx + 1, accounts.length);
                    if (result) {
                        results.push(result);
                        
                        console.clear();
                        this.banner();
                        this.displaySummary(accounts.length, proxyCount, this.c('yellow', '⏳ In progress'), null);
                        console.log('');
                        this.displayAccountInfo(result, idx + 1, accounts.length);
                        this.displayActions(result);
                        console.log('');
                    }

                    await new Promise(resolve => setTimeout(resolve, 3000));
                }

                console.clear();
                this.banner();
                this.displaySummary(accounts.length, proxyCount, this.c('green', '✅ Completed'), null);
                console.log('');
                
                if (results.length > 0) {
                    const lastResult = results[results.length - 1];
                    this.displayAccountInfo(lastResult, results.length, accounts.length);
                    this.displayActions(lastResult);
                }
                
                console.log('');
                console.log(this.c('green', this.c('bright', '  • All accounts processed successfully')));
                console.log('');

                const waitTime = 12 * 60 * 60;
                for (let seconds = waitTime; seconds > 0; seconds--) {
                    console.clear();
                    this.banner();
                    this.displaySummary(accounts.length, proxyCount, this.c('green', '✅ Completed'), this.formatSeconds(seconds));
                    console.log('');
                    
                    if (results.length > 0) {
                        const lastResult = results[results.length - 1];
                        this.displayAccountInfo(lastResult, results.length, accounts.length);
                        this.displayActions(lastResult);
                    }
                    
                    console.log('');
                    console.log(this.c('green', this.c('bright', '  • All accounts processed successfully')));
                    console.log('');
                    
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        } catch (error) {
            if (error.code === 'ENOENT') {
                console.log(this.c('red', '\n❌ File "tokens.txt" not found!'));
            } else {
                console.log(this.c('red', `\n❌ Error: ${error.message}`));
            }
        }
    }
}

const bot = new Providence();
bot.main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});