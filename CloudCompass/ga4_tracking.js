// Get browser name
let browser = (function (agent) {
  switch (true) {
    case agent.indexOf("edge") > -1:
      return "MS Edge (EdgeHtml)";
    case agent.indexOf("edg") > -1:
      return "MS Edge Chromium";
    case agent.indexOf("opr") > -1 && !!window.opr:
      return "opera";
    case agent.indexOf("chrome") > -1 && !!window.chrome:
      return "chrome";
    case agent.indexOf("trident") > -1:
      return "Internet Explorer";
    case agent.indexOf("firefox") > -1:
      return "firefox";
    case agent.indexOf("safari") > -1:
      return "safari";
    default:
      return "other";
  }
})(window.navigator.userAgent.toLowerCase());

// function for generating unique ids
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function track_clicks(click_metadata, action_metadata, event) {
  // An object for storing data sent to ga4
  let payload = {
    value: 1,
    type: "",
    pageUrl: window.location.href,
    elementName: "",
    browser,
    generate_lead: false,
    entry_point: Cookies.get("entry_point"),
    website: "Cloud Compass",
    session: Cookies.get("session_num"),
    action: "",
    deviceType: get_device(),
    userid: Cookies.get("userid"),
  };
  if (event) {
    payload["event"] = event;
  }
  // Get all classnames
  let all_classnames = _.map(click_metadata, "className");
  // Join classnames to a string separated by commas.
  let selectors = all_classnames.join(", ");
  // Listener for all classes that we want to do tracking on.
  $(selectors).on("click", (event) => {
    // check if cookies are allowed
    if (!this.Optanon.IsAlertBoxClosedAndValid() || Cookies.get('entry_point') === undefined){
      return
    }
    // Find the class that was clicked.
    let current_class = all_classnames[0];
    let full_classname =
      "." + event.currentTarget.classList.value.replaceAll(" ", " .");
    // Loop through class names that we are tracking
    for (let c = 0; c < all_classnames.length; c++) {
      let classname = all_classnames[c];
      // find the if our class name is part of full class name clicked
      if (full_classname.includes(classname)) {
        current_class = classname;
      }
    }
    // find the meta-data for the specific class
    let click_datum = _.find(click_metadata, { className: current_class });
    // find class for the element name
    let element_name_class = click_datum["elementName"];
    // Get name of clicked element.
    let elementName = "";
    if (element_name_class === "this") {
      elementName = $(event.target).text();
    } else {
      element = $(event.currentTarget);
      found = [];
      // find the element_name_class by recusively checking in its parents
      while (found.length == 0 && element.length == 1) {
        found = element.find(element_name_class).last();
        element = element.parent();
      }
      elementName = found.text();
    }
    // Add more infomation if element name is learn more
    if (elementName.toLowerCase().includes("learn more")) {
      let moreInfoElement = click_datum.moreInfo ? click_datum.moreInfo : "h2";
      element = $(event.currentTarget);
      found = [];
      // find the element_name_class by recusively checking in its parents
      while (found.length == 0 && element.length == 1) {
        found = element.find(moreInfoElement).last();
        element = element.parent();
      }
      elementName = "Learn more - " + found.text();
    }

    // Add more infomation if element name is download
    if (elementName.toLowerCase().includes("download")) {
      let moreInfoElement = click_datum.moreInfo ? click_datum.moreInfo : "h4";
      element = $(event.currentTarget);
      found = [];
      // find the element_name_class by recusively checking in its parents
      while (found.length == 0 && element.length == 1) {
        found = element.find(moreInfoElement).last();
        element = element.parent();
      }
      elementName += " - " + found.text();
    }

    // exception to the above element name functionality
    if (click_datum.exceptions) {
      if (click_datum.exceptions.includes(elementName.toLowerCase())) {
        let element_name_index = click_datum.exceptions.indexOf(
          elementName.toLowerCase()
        );
        element_name_class = click_datum.replacement[element_name_index];
        if (element_name_class === "this") {
          elementName = $(event.target).text();
        } else {
          element = $(event.currentTarget);
          found = [];
          // find the element_name_class by recusively checking in its parents
          while (found.length == 0 && element.length == 1) {
            found = element.find(element_name_class).last();
            element = element.parent();
          }
          elementName = found.text();
        }
      }
    }
    // Save name to our output object
    payload["elementName"] = elementName;

    // Get type of clicked element.
    let clickType = click_datum["clickType"];
    // Save our click type output object
    payload["type"] = clickType;
    // Save our lead output object
    payload["generate_lead"] = click_datum["generate_lead"];

    // Check for exceptions in the attribute of an element
    let gtag_exception = $(event.currentTarget).attr("gtag-exception");
    if (gtag_exception) {
      keyVals = gtag_exception.split(",");
      for (let index = 0; index < keyVals.length; index++) {
        let keyVal = keyVals[index].split(":");
        payload[keyVal[0]] = keyVal[1];
      }
    }

    // Add search_query to parameter if needed
    if (payload["type"].toLowerCase().includes("search")) {
      // special code for lighouse dropdown
      let openDropdown = $(event.currentTarget).attr('aria-expanded')
      if(openDropdown === "false"){payload["elementName"] = 'searchOpen'}
      else{payload["elementName"] = 'searchClose'}
      payload['search_query'] = $('.element_name_class').closest('input').val()
    }

    // logic for detecting if a click is a conversion
    action_keys = Object.keys(action_metadata);
    let action = "";
    // get text on the element clicked
    let element_action = $(event.target).text();
    if (element_action == "") {
      element_action = payload["elementName"];
    }
    // loop through our action keys and get action if element name matches
    for (let index = 0; index < action_keys.length; index++) {
      let key = action_keys[index];
      if (element_action.toLowerCase().includes(key)) {
        action = action_metadata[key];
        if (action !== "file_download") {
          payload["generate_lead"] = true;
        }
      }
    }
    // Save to our output object
    payload["action"] = action;

    // send custom event to gtag
    if (action === "file_download") {
      gtag("event", "file_download", {
        userid: Cookies.get("userid"),
        transaction_id: uuidv4(),
        elementName: payload["elementName"],
        deviceType: get_device(),
        browser,
        website: "Cloud Compass",
        session: Cookies.get("session_num"),
        pageUrl: payload["pageUrl"],
      });
    }

    // send custon event to gtag.
    gtag("event", "user_click", payload);
    // send recomended event generate lead to gtag
    if (payload["generate_lead"].toString() === "true") {
      gtag("event", "generate_lead", {
        userid: Cookies.get("userid"),
        transaction_id: uuidv4(),
        action: payload["action"],
        elementName: payload["elementName"],
        deviceType: get_device(),
        browser,
        website: "Cloud Compass",
        session: Cookies.get("session_num"),
        pageUrl: payload["pageUrl"],
        demandBase: window.Demandbase.IP.CompanyProfile || {},
      });
    }
  }); // end of listener
} // end function

// Check if the browser being used is mobile/desktop
function get_device() {
  let deviceType = "desktop";
  const userAgent = navigator.userAgent.toLowerCase();
  if (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    )
  ) {
    deviceType = "mobile";
  }
  const isTablet =
    /(ipad|tablet|kindle|playbook|(puffin(?!.*(IP|AP|WP))))/.test(userAgent);
  if (isTablet) {
    deviceType = "tablet";
  }
  return deviceType;
}
$(document).ready(() => {
  // function for generating unique id
  function uuidv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  const startTime = new Date();

  // extract google client id and set it as user id
  let userdefined = false;
  if (Cookies.get("userid") !== undefined) {
    userdefined = true;
    set_up_cookies(Cookies.get("userid"));
  }

  if (Cookies.get("userid") === undefined) {
    // set cookie user id
    let unique_id;
    gtag("get", "G-RDXJELVJTG", "client_id", async (field) => {
      unique_id = await String(field);
      await Cookies.set("userid", unique_id);
      // set a first visit event
      await gtag("event", "first_visit", {
        userid: String(field),
        deviceType: get_device(),
        browser,
        website: "Cloud Compass",
        pageUrl: window.location.href,
        date: new Date().toString(),
      });
      // set up tracking cookies
      set_up_cookies(String(field));
    });

    userdefined = true;
  }
  function set_up_cookies(uid) {
    // set a cookie for first visit
    if (Cookies.get("first_visit") === undefined) {
      Cookies.set("first_visit", new Date().toString(), { expires: 1 });
    }
    // set a cookie for session number
    if (Cookies.get("session_num") === undefined) {
      Cookies.set("session_num", "0");
    }
    // set an cookie for entry point
    if (Cookies.get("entry_point") === undefined) {
      Cookies.set("entry_point", window.location.href.split("?")[0], {
        expires: 2 / 24,
      });
      // get current date
      let d = new Date();

      // check if 24 hours have passed
      var timeDiff = d - Date.parse(Cookies.get("first_visit")); //in ms
      // strip the ms
      timeDiff /= 1000;
      // strip the second&minutes
      timeDiff /= 60 * 60;
      // if 24 hours have not elapsed
      if (timeDiff < 24) {
        let session = Number(Cookies.get("session_num")) + 1;
        Cookies.set("session_num", session.toString());
      } else {
        Cookies.set("first_visit", new Date().toString(), { expires: 1 });
        Cookies.set("session_num", "1");
      }

      let ye = new Intl.DateTimeFormat("en", { year: "numeric" }).format(d);
      let mo = new Intl.DateTimeFormat("en", { month: "long" }).format(d);
      let da = new Intl.DateTimeFormat("en", { day: "2-digit" }).format(d);
      let hrmn = new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "numeric",
      }).format(d);
      let date_string = `${mo} ${da}, ${ye}`;
      let time_string = `${hrmn}`;
      gtag("event", "start_point", {
        value: 1,
        date: new Date().toString(),
        userid: uid,
        browser,
        website: "Cloud Compass",
        session: Cookies.get("session_num"),
        pageUrl: window.location.href.split("?")[0],
        deviceType: get_device(),
      });
    }

    // track ad campaingns
    let url = new URL(window.location.href);
    let c = url.searchParams.get("utm_source");
    if (c  && Cookies.get("userid") !== undefined) {
      gtag("event", "ad_campaign", {
        value: 1,
        userid: uid,
        browser,
        session: Cookies.get("session_num"),
        website: "Cloud Compass",
        pageUrl: window.location.href.split("?")[0],
        campaign_name: c,
        generate_lead: true,
        entry_point: Cookies.get("entry_point"),
        source: url.searchParams.get("utm_source"),
        medium: url.searchParams.get("utm_medium"),
        utm_id: url.searchParams.get("utm_id"),
        term: url.searchParams.get("utm_term"),
        utm_content: url.searchParams.get("utm_content"),
        deviceType: get_device(),
      });
    }
  } //end of function set up

  // track search
  if (window.location.href.includes("search?") && Cookies.get("userid") !== undefined) {
    let url = new URL(window.location.href);
    gtag("event", "site_search", {
      value: 1,
      userid: Cookies.get("userid"),
      browser,
      session: Cookies.get("session_num"),
      website: "Cloud Compass",
      pageUrl: window.location.href.split("?")[0],
      search_query: url.searchParams.get("query"),
      generate_lead: false,
      entry_point: Cookies.get("entry_point"),
      deviceType: get_device(),
    });
  }

  /** scroll tracking **/
  let scrollPercent = 0;
  $(window).on("scroll", function () {
    var s = $(window).scrollTop(),
      d = $(document).height(),
      c = $(window).height();

    scrollPercent = (s / (d - c)) * 100;
  });

  // detect if the user is about to leave the page
  window.addEventListener("beforeunload", function (e) {
    // send scrolled percent custom event to gtag.
    gtag("event", "scrolled_percent", {
      browser,
      website: "Cloud Compass",
      session: Cookies.get("session_num"),
      value: scrollPercent,
      pageUrl: window.location.href.split("?")[0],
      userid: Cookies.get("userid"),
      deviceType: get_device(),
    });

    // Tracking time sent on the website.
    let timeSpent = (new Date() - startTime) / 1000;
    // send spent time custom event to gtag.
    gtag("event", "time_spent", {
      value: 1,
      timeSpent,
      units: "seconds",
      website: "Cloud Compass",
      session: Cookies.get("session_num"),
      pageUrl: window.location.href.split("?")[0],
      browser,
      userid: Cookies.get("userid"),
      deviceType: get_device(),
    });
  });

  // send event for nav link click
  let action_metadata = {
    submit: "form_submission",
    download: "file_download",
    "get in touch": "form_submission",
  };
  let click_metadata = [
    {
      className: ".footer-link",
      clickType: "footerClick",
      elementName: "this",
      generate_lead: "false",
    },
    {
      className: ".footer-button",
      clickType: "footerClick",
      elementName: "this",
      generate_lead: "false",
    },
    {
      className: ".footer-social-icon",
      clickType: "socialClick",
      elementName: "this",
      generate_lead: "false",
    },
    {
      className: ".nav_link",
      clickType: "navClick",
      elementName: "this",
      generate_lead: "false",
    },
    {
      className: ".nav-logo",
      clickType: "navClick",
      elementName: "this",
      generate_lead: "false",
    },
  ];

  track_clicks(click_metadata, action_metadata);
}); // end of document ready
