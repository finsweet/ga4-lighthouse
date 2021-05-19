//--url params persistency 
$(document).ready( () => {
  let queryParams = [
          'utm_medium',
          'utm_source',
          'utm_campaign',
          'utm_content',
          'utm_id',
          'utm_term'
      ]
  // Loop through all links 
  let links = document.querySelectorAll('a');
  let current_link = window.location.href
  var url = new URL(current_link);
  // Get param values.
  let queryValues = {}
  for (var paramIndex = 0; paramIndex < queryParams.length; paramIndex++) {
    let paramValue = url.searchParams.get(queryParams[paramIndex]);
    if (paramValue){
      queryValues[queryParams[paramIndex]] = paramValue
    }
  }
  for (var linkIndex = 0; linkIndex < links.length; linkIndex++) {
    let new_link = ""
    let link_to_change = links[linkIndex].href.includes('http') ? new URL(links[linkIndex].href) : new URL(window.location.origin+links[linkIndex].href)
    // build a link from queryValues object
    for (var key in queryValues) {
          if (queryValues.hasOwnProperty(key) ) {
             // find if a href already has params if not buld the new url string
             if (link_to_change.searchParams.get(key)){}
             else{new_link += key + "=" + queryValues[key]+'&';}
          }
      }
    // remove trailing '&'
    new_link = new_link.endsWith("&") ? new_link.slice(0,-1): new_link
    // get a new link for each href
    let decorated_link = ''
    if (links[linkIndex].href.includes('#')){
      decorated_link = links[linkIndex].href
    }
    else{
      decorated_link = links[linkIndex].href.includes('?') ? links[linkIndex].href+'&'+ new_link : links[linkIndex].href+'?'+new_link
    }
    decorated_link = decorated_link.replace('\/\?', '?')
    // remove trailing '?'
    decorated_link = decorated_link.endsWith("?") ? decorated_link.slice(0,-1): decorated_link
    links[linkIndex].href = decorated_link
  }
})