/*
 * Browser check variables
 * If you support IE, our recommendation is that you sign-in using Redirect APIs
 * If you as a developer are testing using Edge InPrivate mode, please add "isEdge" to the if check
 */
const ua = window.navigator.userAgent;
const msie = ua.indexOf("MSIE ");
const msie11 = ua.indexOf("Trident/");
const msedge = ua.indexOf("Edge/");
const isIE = msie > 0 || msie11 > 0;
const isEdge = msedge > 0;

let signInType;
let accountId = "";

/*
 * Create the main myMSALObj instance
 * configuration parameters are located at authConfig.js
 */
const myMSALObj = new msal.PublicClientApplication(msalConfig);

// Redirect: once login is successful and redirects with tokens, call Graph API
myMSALObj.initialize().then(() => {
    myMSALObj.handleRedirectPromise().then(handleResponse).catch(err => {
        console.error(err);
    });
});

async function performSilentSSOWithinIFrame(sid) {
    console.log('performing silentSSO with sid', sid);
    await myMSALObj.initialize().then(() => {});
    myMSALObj.ssoSilent({
        sid
    }).then((response) => {
        // do something with response
        console.log('I received this response');
    }).catch(error => {
        // handle errors
        console.log('I received errors');
        if (error instanceof msal.InteractionRequiredAuthError) {
            myMSALObj.loginPopup()
                .then((response) => {
                    // do something with response
                });
        } else if (error instanceof msal.BrowserAuthError) {
            if (error.errorCode === "silent_sso_error") {
                // e.g. username is null
            }
            if (error.errorCode === "popup_window_error") {
                // e.g. popups are blocked
            }
        } else {
            console.log(error);
        }
    });
}

function sendMessageToIFrame() {
    console.log('Called sending message to iFrame');
    var childIFrame = document.getElementById('child_iframe');
    function bindEvent(element, eventName, eventHandler) {
            if (element.addEventListener){
                element.addEventListener(eventName, eventHandler, false);
            } else if (element.attachEvent) {
                element.attachEvent('on' + eventName, eventHandler);
            }
    }

    var sendMessage = function(msg) {
            // Make sure you are sending a string, and to stringify JSON
            childIFrame.contentWindow.postMessage(msg, '*');
        };

    var sendButton = document.getElementById('message_button');

    bindEvent(sendButton, 'click', function (e) {
            sendMessage();
    });
}

function handleResponse(resp) {
    console.log('handleResponse', JSON.stringify(resp));
    if (resp !== null) {
        accountId = resp.account.homeAccountId;
        myMSALObj.setActiveAccount(resp.account);
        showWelcomeMessage(resp.account);
    } else {
        // need to call getAccount here?
        const currentAccounts = myMSALObj.getAllAccounts();
        if (!currentAccounts || currentAccounts.length < 1) {
            myMSALObj.ssoSilent(loginRequest).then((response) => {
                accountId = response.account.homeAccountId;
                showWelcomeMessage(response.account);
                getTokenRedirect(loginRequest, response.account);
            }).catch(error => {
                console.error("Silent Error: " + error);
                if (error instanceof msal.InteractionRequiredAuthError) {
                    myMSALObj.ssoSilent(silentRequest).then((response) => {
                        accountId = response.account.homeAccountId;
                        showWelcomeMessage(response.account);
                        getTokenRedirect(loginRequest, response.account);
                    }).catch(err => {
                        console.error("Silent Error: " + err);
                        if (err instanceof msal.InteractionRequiredAuthError) {
                            console.log("popup sign in")
                            signIn("popup");
                        }
                    })
                }
            });
            return;
        } else if (currentAccounts.length > 1) {
            // Add choose account code here
        } else if (currentAccounts.length === 1) {
            const activeAccount = currentAccounts[0];
            myMSALObj.setActiveAccount(activeAccount);
            accountId = activeAccount.homeAccountId;
            showWelcomeMessage(activeAccount);
        }
    }
}

async function signIn(method) {
    signInType = isIE ? "loginRedirect" : method;
    if (signInType === "loginPopup") {
        return myMSALObj.loginPopup(loginRequest).then(handleResponse).catch(function (error) {
            console.log(error);
        });
    } else if (signInType === "loginRedirect") {
        return myMSALObj.loginRedirect(loginRequest);
    }
}

function signOut() {
    const logoutRequest = {
        account: myMSALObj.getAccountByHomeId(homeAccountId)
    };
    myMSALObj.logoutRedirect(logoutRequest);
}
