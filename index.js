var http = require('http')
var jsdom  = require('jsdom')
var setCookie = require('set-cookie-parser')

async function getStatus() {
    return await fetch('https://gradapp.gatech.edu/account/login').
        then((res) => {
            cookieStr = res.headers.get('set-cookie')
            cookieHdrs = setCookie.splitCookiesString(cookieStr)
            cookies = setCookie.parse(cookieHdrs)
            return cookies.map((e) => e['name']+"="+e['value']).join(';')
        }).
        then(async (cookie) => await fetch('https://gradapp.gatech.edu/account/login', {
            method: 'POST',
            redirect: 'manual',
            headers: {
                'content-type': 'application/x-www-form-urlencoded',
                'cookie': cookie,
                'referer': 'https://gradapp.gatech.edu/account/login'
            },
            body: new URLSearchParams({'email':process.env.EMAIL, 'password':process.env.PASSWORD})
        })).
        then((res) => {
            cookieStr = res.headers.get('set-cookie')
            cookieHdrs = setCookie.splitCookiesString(cookieStr)
            cookies = setCookie.parse(cookieHdrs)
            return cookies.map((e) => e['name']+"="+e['value']).join(';')
        }).
        then(async (cookie) => await fetch('https://gradapp.gatech.edu/apply/', {
            method: 'GET', 
            headers: {'referer': 'https://gradapp.gatech.edu/account/login', 'cookie': cookie }
        })).
        then((res) => res.text()).
        then((txt) => new jsdom.JSDOM(txt).window.document.getElementsByClassName('table nohighlight').item(0).rows[4].cells[1].textContent)
}

async function push(msg) {
    return await fetch('https://ntfy.sh/linh-omscs', {
        method: 'POST', // PUT works too
        body: msg + ' 😀'
    }).then((res) => res.text())
}

async function cron() {
    stat = await getStatus()
    if (stat != 'Submitted') {
        await push('New status: ' + stat)
    }
    
    console.log(stat)
    return stat
}

http.createServer(async function (req, res) {
    console.log(`Just got a request at ${req.url}!`)
    ret = ''
    if (req.url === "/push") {
        ret = await push('Hello')
    }
    else if (req.url === "/getStatus") {
        ret = await getStatus()
    }
    else if (req.url === "/cron") {
        ret = await cron()
    }
    res.write(ret)
    res.end();
}).listen(process.env.PORT || 3000);
