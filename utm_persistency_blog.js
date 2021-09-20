window.onload = function(e) {
    addUTMs()
}

function addUTMs() {
    // Select the node that will be observed for mutations
    const targetNode = document.querySelector('.row-number-11')

    // Options for the observer (which mutations to observe)
    const config = { attributes: true, childList: true, subtree: true }

    const queryString = window.location.search
    const urlParams = new URLSearchParams(queryString)
    let utm_params = [
        'utm_medium',
        'utm_source',
        'utm_campaign',
        'utm_content',
        'utm_id',
        'utm_term',
        'gclid',
    ]
    function append_utms(href, qString) {
        if (href.includes('?')) {
            return href + '&' + qString
        } else {
            return href + '?' + qString
        }
    }
    // build query string
    let utm_query_string = ''
    for (let index = 0; index < utm_params.length; index++) {
        let param = utm_params[index]
        let val = urlParams.get(param)
        if (val) {
            utm_query_string = utm_query_string + `${param}=${val}&`
        }
    }
    //remove trailing &
    utm_query_string = utm_query_string.slice(0, -1)
    // Callback function to execute when mutations are observed
    const callback = function(mutationsList, observer) {
        // Use traditional 'for loops' for IE 11
        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                $('.uf-tile').each((index, elem) => {
                    elem.href = append_utms(elem.href, utm_query_string)
                })
            }
        }
    }

    // Create an observer instance linked to the callback function
    const observer = new MutationObserver(callback)

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config)
}