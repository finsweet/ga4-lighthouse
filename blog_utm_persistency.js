window.addEventListener("load", function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    let utm_params = ["utm_source", "utm_medium", "utm_campaign", "utm_term"];
  
    function append_utms(href, qString) {
      if (href.includes("?")) {
        return href + "&" + qString;
      } else {
        return href + "?" + qString;
      }
    }
    // build query string
    let utm_query_string = "";
    for (let index = 0; index < utm_params.length; index++) {
      let param = utm_params[index];
      let val = urlParams.get(param);
      utm_query_string = utm_query_string + `${param}=${val}&`;
    }
    //remove trailing &
    utm_query_string = utm_query_string.slice(0, -1);
  
    // add to query strings to all links
    let links = document.getElementsByTagName("a");
    for (let i = 0, max = links.length; i < max; i++) {
      links[i].href = append_utms(links[i].href, utm_query_string);
    }
  });
  