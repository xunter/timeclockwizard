const fetch = require('node-fetch');
const process = require('process');

const urlLogin = "https://apps.timeclockwizard.com/Login";
const subdomainDefault = "nextmillennium1";

let username = getCommandLineParameter("username");
let password = getCommandLineParameter("password");
let command = getCommandLineParameter("command");
let subdomain = getCommandLineParameter("subdomain") || subdomainDefault;

fetch(urlLogin + "?subDomain=" + subdomain, { 
    headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36"
    }
}).then((res) => {

    let cookies = res.headers.raw()['set-cookie'];
    cookies.map(cookie => cookie.split(';')[0]).join('; ');
    let cookiesVal = cookies.map(cookie => cookie.split(';')[0]).join('; ');

    res.text().then((html) => {

        let requestValidationTokenMatch = html.match(/\<input name="__RequestVerificationToken" type="hidden" value="([^"]+)" \/\>/i);
        if (!requestValidationTokenMatch) {
            console.log("bad or currupted or updated html");
            return;
        }

        let requestValidationToken = requestValidationTokenMatch[1];

        let payload = new URLSearchParams();
        payload.append("__RequestVerificationToken", requestValidationToken);
        payload.append("Subdomain", subdomain);
        payload.append("ClientDetails.QuickClockInPassword", "True");
        payload.append("ClientDetails.QuickClockIn", "True");
        payload.append("UserName", username);
        payload.append("Password", password);
        payload.append("command", command);

        fetch(urlLogin, {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
                "Cookie": cookiesVal
            },
            body: payload
        }).then((res) => {
            res.text().then((answer) => {
                if (answer.indexOf("Das_C_YouAreAlreadyClockedIn") !== -1) {
                    console.log("You are already clocked in.");
                } else if (answer.indexOf("Das_C_ClockOutSuccessMsg") !== -1) {
                    console.log("Clocked out successfully.");
                }
                console.log("SUCCESS");
            });
        });

    });
});

function getCommandLineParameter(parameterName) {
	var value = process.argv.slice(2).find(function(element) {
		return element.indexOf(parameterName + "=") == 0;
	});

	if (value) {
		return value.replace(parameterName + "=", "");
	}

	return "";
}