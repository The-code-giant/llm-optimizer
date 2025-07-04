let saDyoHeaderInsertionCount = 0;
let saDyoHeaderTitleTagCount = 0;
let saDyoHeaderMetaTagCount = 0;
let saDyoBodyHtmlTopInsertionCount = 0;
let saDyoBodyHtmlBottomInsertionCount = 0;
let saDyoLinksUpdationCount = 0;
const saDyoHeadersUpdationCount = {h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0};
let saDyoImagesAltsUpdationCount = 0;
let saDyoFooterHtmlInsertionCount = 0;

const saDyoUrlParams = new URLSearchParams(window.location.search);
const saDyoDiagnosticsExist = saDyoUrlParams.has('diagnostics');

const consolePrint = strData => {
  if (saDyoDiagnosticsExist) {
    console.log(strData);
  }
};

const fetchData = async (pageUrl, uuid) => {
  let saDyoApiUrl = `https://sa.searchatlas.com/api/v2/otto-url-details/?url=${pageUrl}`;
  if (uuid) saDyoApiUrl += `&uuid=${uuid}`;

  try {
    const saDyoResponse = await fetch(saDyoApiUrl);
    if (!saDyoResponse.ok) {
      console.log('API call failed.');
      return;
    }
    const saDyoPageData = await saDyoResponse.json();
    consolePrint(`API response: ${saDyoPageData}`);
    if ((window.location.origin + window.location.pathname) === pageUrl) applyPageData(saDyoPageData);
    return saDyoPageData;
  } catch (error) {
    console.log('Fetch error:', error);
  }
};

const postPageCrawlLogs = async (pageUrl, uuid, context) => {
  try {
    const saDyoUseragent = navigator.userAgent;
    if (saDyoUseragent.includes('bot')) {
      const saDyoApiUrl = `https://sa.searchatlas.com/api/v2/otto-page-crawl-logs/`;
      const saDyoBodyData = {
        otto_uuid: uuid,
        url: pageUrl,
        user_agent: saDyoUseragent,
        context: context,
      };

      try {
        const saDyoResources = performance.getEntriesByType('resource');

        // 1. Average Page Response Time
        const saDyoTotalResponseTime = saDyoResources.reduce((sum, resource) => sum + (resource.responseEnd - resource.startTime), 0);
        const saDyoAverageResponseTime = (saDyoResources.length > 0) ? (saDyoTotalResponseTime / saDyoResources.length).toFixed(2) : null;

        // 2. Total Download Size
        const saDyoTotalDownloadSize = saDyoResources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
        const saDyoTotalDownloadSizeKB = (saDyoTotalDownloadSize / 1024).toFixed(2);

        if (saDyoAverageResponseTime) {
          saDyoBodyData.average_response_time = saDyoAverageResponseTime;
        }

        if (saDyoTotalDownloadSizeKB) {
          saDyoBodyData.total_download_size_kb = saDyoTotalDownloadSizeKB;
        }
      } catch (error) {
        consolePrint(`Resources error: ${error}`);
      }

      const saDyoResponse = await fetch(saDyoApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(saDyoBodyData),
      });

      if (!saDyoResponse.ok) {
        console.log('API call failed.');
        return;
      }
      const pageData = await saDyoResponse.json();
      consolePrint(`API response: ${pageData}`);
    }
  } catch (error) {
    consolePrint(`Fetch error: ${error}`);
  }
};

const replaceMetaData = metaData => {
  let saDyoHeaderElementExist = false;
  const {type, name, property, recommended_value} = metaData;
  const saDyoRecommendedValue = recommended_value;

  if (type === 'title') {
    const saDyoTitles = document.querySelectorAll('title');
    if (saDyoTitles?.length) {
      saDyoTitles?.forEach(item => {
        if (!window?.next) item?.remove();
      });
    }
    saDyoHeaderElementExist = false;
  } else {
    const saDyoMetaSelector = `meta[name="${(name || property)?.trim()}"], meta[property="${(name || property)?.trim()}"]`;
    saDyoHeaderElementExist = document.querySelector(saDyoMetaSelector) || false;
  }

  if (saDyoHeaderElementExist) {
    consolePrint(`Header Meta - ${saDyoHeaderElementExist}`);
    if (type === 'title') {
      saDyoHeaderTitleTagCount++;
      consolePrint(`Replacing existing title content - ${saDyoRecommendedValue}`);
      saDyoHeaderElementExist.innerHTML = saDyoRecommendedValue;
    } else {
      consolePrint(`Replacing existing Meta content - ${saDyoRecommendedValue}`);
      saDyoHeaderMetaTagCount++;
      saDyoHeaderElementExist.setAttribute('content', saDyoRecommendedValue);
    }
  } else {
    if (type === 'title') {
      consolePrint(`Header Title Not Found - ${type}`);
      saDyoHeaderTitleTagCount++;
      if (window?.next) {
        const saDyoTitle = document.querySelector('title');
        saDyoTitle.innerHTML = saDyoRecommendedValue;
      } else {
        const saDyoTitleTag = `<title>${saDyoRecommendedValue}</title>`;
        consolePrint(`Inserting Title tag element: ${saDyoTitleTag}`);
        document.head.insertAdjacentHTML('afterbegin', saDyoTitleTag);
      }
    } else {
      consolePrint(`Header Meta Not Found - ${type}`);
      const saDyoMetaAttribute = property ? 'property' : 'name';
      const saDyoMetaTag = `<meta ${saDyoMetaAttribute}="${property ? property : name}" content="${saDyoRecommendedValue}">`;
      saDyoHeaderMetaTagCount++;
      consolePrint(`Inserting tag element: ${saDyoMetaTag}`);
      document.head.insertAdjacentHTML('afterbegin', saDyoMetaTag);
    }
  }
};

const addAltTextToImages = images => {
  const saDyoAllImgsElements = document.querySelectorAll(`img`);
  saDyoAllImgsElements?.forEach(imgElement => {
    images?.forEach(([imageUrl, altText]) => {
      Array.from(imgElement?.attributes).forEach(attribute => {
        if (attribute.value === imageUrl) {
          saDyoImagesAltsUpdationCount++;
          consolePrint(`Adding/updating alt text for ${imgElement} with: ${altText}`);
          imgElement.alt = altText;
        }
      });
    });
  });
  consolePrint(`Total alt texts updated: ${saDyoImagesAltsUpdationCount}`);
};

const htmlDecode = input => {
  const saDyoDoc = new DOMParser().parseFromString(input, 'text/html');
  return saDyoDoc.documentElement.textContent;
};

let intervalID;

const applyPageData = saDyoPageData => {
  consolePrint(`Header HTML insertion started: ${saDyoPageData.header_html_insertion}`);
  const saDyoHtmlToInject = saDyoPageData.header_html_insertion ? `${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Header Integration Start -->' : '' }${saDyoPageData.header_html_insertion}${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Header Integration Ended -->' : '' }` : '';
  if (saDyoHtmlToInject) {
    document.head.insertAdjacentHTML('afterbegin', saDyoHtmlToInject);
    saDyoHeaderInsertionCount++;
  }
  consolePrint(`Header HTML insertion ended: ${saDyoHtmlToInject}`);

  try {
    consolePrint(`Header replacements started: ${saDyoPageData.header_replacements}`);
    if (Array.isArray(saDyoPageData.header_replacements)) {
      saDyoPageData.header_replacements?.forEach(data => {
        replaceMetaData(data);
      });
    }
    consolePrint(`Header replacements ended: ${saDyoPageData.header_replacements}`);
  } catch (error) {
    consolePrint(`Header replacements Error: ${error}`);
  }

  const saDyoBodyElement = document.querySelector('body');

  consolePrint(`Body top HTML insertion started: ${saDyoPageData.body_top_html_insertion}`);
  const saDyoTopHtmlToInject = saDyoPageData.body_top_html_insertion ? `${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Body Top Integration Start -->' : ''}${saDyoPageData.body_top_html_insertion}${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Body Top Integration Ended -->' : ''} ` : '';
  if (saDyoTopHtmlToInject) {
    saDyoBodyHtmlTopInsertionCount++;
    saDyoBodyElement.insertAdjacentHTML('afterbegin', saDyoTopHtmlToInject);
  }
  consolePrint(`Body top HTML insertion ended: ${saDyoTopHtmlToInject}`);

  consolePrint(`Body bottom HTML insertion started: ${saDyoPageData.body_bottom_html_insertion}`);
  const saDyoBottomHtmlToInject = saDyoPageData.body_bottom_html_insertion ? `${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Body Bottom Integration Start -->' : ''}${saDyoPageData.body_bottom_html_insertion}${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Body Bottom Integration Ended -->' : ''} ` : '';
  if (saDyoBottomHtmlToInject) {
    saDyoBodyHtmlBottomInsertionCount++;
    saDyoBodyElement.insertAdjacentHTML('beforeend', saDyoBottomHtmlToInject);
  }
  consolePrint(`Body bottom HTML insertion ended: ${saDyoBottomHtmlToInject}`);

  consolePrint('Body substitutions started');
  for (const [saDyoBodySubstitutionsKey, saDyoData] of Object.entries(saDyoPageData.body_substitutions)) {
    if (saDyoBodySubstitutionsKey !== 'images') {
      consolePrint(`${saDyoBodySubstitutionsKey} - updating element value: ${saDyoData}`);
      if (saDyoBodySubstitutionsKey === 'links') {
        const listData = Object.entries(saDyoData);
        if (listData.length) {
          document.querySelectorAll(`a[href="${listData[0][0]}"]`)?.forEach(element => {
            saDyoLinksUpdationCount++;
            element.href = listData[0][1];
          });
        }
      } else if (saDyoBodySubstitutionsKey === 'headings') {
        saDyoData?.forEach(item => {
          document.querySelectorAll(item.type)?.forEach(element => {
            if (element.textContent.trim() === item.current_value.trim()) {
              consolePrint(`${item.type} - heading - ${element.textContent} - Recommended heading - ${item.recommended_value}`);
              saDyoHeadersUpdationCount[item.type]++;
              const targetElement = element;
              const preserveSpecialCharacterInText = htmlDecode(element.innerHTML).replace(item.current_value, item.recommended_value);
              targetElement.innerHTML = (element.innerHTML.includes('</') || element.innerHTML.includes('/>') ? element.innerHTML : htmlDecode(element.innerHTML)).replaceAll(item.current_value, preserveSpecialCharacterInText);
            }
          });
        });
      }
    }
  }
  consolePrint('Body substitutions ended');

  if (saDyoPageData.header_replacements?.length > 0) {
    const saDyoCanonicalLink = saDyoPageData.header_replacements.find(item=> item?.type == 'link' && item?.rel == 'canonical');
    const element = document.querySelector(`link[rel="canonical"]`);
    if (saDyoCanonicalLink && element) {
      element.href = saDyoCanonicalLink?.recommended_value;
    }
  }

  consolePrint('Intersection of missing alt tags started');
  saDyoPageData?.body_substitutions?.images && addAltTextToImages(Object.entries(saDyoPageData?.body_substitutions?.images));
  consolePrint('Intersection of missing alt tags ended');

  consolePrint(`Footer HTML insertion started: ${saDyoPageData.footer_html_insertion}`);
  if (saDyoPageData.footer_html_insertion) {
    let saDyoFooterElement = document.querySelector('footer');
    if (!saDyoFooterElement) {
      consolePrint('Footer element not found');
      saDyoFooterElement = document.createElement('footer');
      document.body.appendChild(saDyoFooterElement);
      consolePrint('Footer element added to footer');
    }

    const saDyoFooterHtmlToInject = saDyoPageData.footer_html_insertion ? `${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Footer Integration Start -->' : ''}${saDyoPageData.footer_html_insertion}${saDyoDiagnosticsExist ? '<!-- Dynamic Optimization Footer Integration Ended -->' : ''} ` : '';
    saDyoFooterHtmlInsertionCount++;
    saDyoFooterElement.insertAdjacentHTML('beforeend', saDyoFooterHtmlToInject);
    consolePrint(`Footer HTML inserted: ${saDyoFooterHtmlToInject}`);
  }
  consolePrint(`Footer HTML insertion ended: ${saDyoPageData.footer_html_insertion}`);

  consolePrint('*************************************************************');
  consolePrint('******************** Diagnostics Summary ********************');
  consolePrint(`Header Insertions: ${saDyoHeaderInsertionCount}`);
  consolePrint(`Header Title Updated: ${saDyoHeaderTitleTagCount}`);
  consolePrint(`Body Top HTML Insertions: ${saDyoBodyHtmlTopInsertionCount}`);
  consolePrint(`Body Bottom HTML Insertions: ${saDyoBodyHtmlBottomInsertionCount}`);
  consolePrint(`Footer HTML Insertions: ${saDyoFooterHtmlInsertionCount}`);

  consolePrint(`Header Meta Tag Updated: ${saDyoHeaderMetaTagCount} out of ${Array.isArray(saDyoPageData.header_replacements) ? saDyoPageData.header_replacements?.filter(item => item.type != 'title')?.length : 0}`);
  consolePrint(`Image Alt Replacements: ${saDyoImagesAltsUpdationCount} out of ${('images' in saDyoPageData.body_substitutions) ? Object.keys(saDyoPageData.body_substitutions?.images)?.length : 0}`);
  consolePrint(`Link Replacements: ${saDyoLinksUpdationCount} out of ${('links' in saDyoPageData.body_substitutions) ? Object.keys(saDyoPageData.body_substitutions?.links)?.length : 0}`);
  Object.entries(saDyoHeadersUpdationCount).forEach(value => {
    consolePrint(`${value[0]} headings replaced - ${value[1]}`);
  });
  consolePrint('*************************************************************');
  consolePrint('*************************************************************');
};

// Function to remove content between specific comments
const removeDynamicOptimizationContent = () => {
  // todo: google-site-verification is not being removed, add data-otto-pixel from be
  const saDyoElementsToRemove = document.querySelectorAll('[data-otto-pixel="dynamic-seo"],[data-otto-pixel="searchatlas"]');
  if (saDyoElementsToRemove.length > 0) {
    try {
      saDyoElementsToRemove.forEach(element => element.remove());
    } catch (error) {
      console.log(error);
    }
  }
};


const intervalFunctionToRendermetaData = saDyoPageData => {
  intervalID = setInterval(() => {
    if (Array.isArray(saDyoPageData.header_replacements)) {
      saDyoPageData.header_replacements?.forEach(data => {
        replaceMetaData(data);
      });
    }
  }, 3000);
};

const initializeScript = async () => {
  consolePrint('Script initialization');
  const saDyoUuid = document.getElementById('sa-otto')?.getAttribute('data-uuid') || document.getElementById('searchatlas')?.getAttribute('data-uuid') || document.getElementById('sa-dynamic-optimization')?.getAttribute('data-uuid');
  consolePrint(`UUID: ${saDyoUuid}`);
  try {
    const saDyoPushState = history.pushState;
    history.pushState = function() {
      // eslint-disable-next-line prefer-rest-params
      saDyoPushState.apply(history, arguments);
      window.dispatchEvent(new Event('locationchange'));
    };
    window.onpopstate = function() {
      window.dispatchEvent(new Event('locationchange'));
    };
    window.addEventListener('locationchange', async () => {
      removeDynamicOptimizationContent();
      clearInterval(intervalID);
      const saDyoPageData = await fetchData(window.location.origin + window.location.pathname, saDyoUuid);
      if (saDyoPageData) {
        window.addEventListener('load', () => {
          postPageCrawlLogs(window.location.href, saDyoUuid, null);
        });
        intervalFunctionToRendermetaData(saDyoPageData);
        setTimeout(() => {
          clearInterval(intervalID);
        }, 30000);
      }
    });
  } catch (error) {
    consolePrint(`Routing issue: ${error}`);
  }

  window.addEventListener('load', () => {
    postPageCrawlLogs(window.location.href, saDyoUuid, null);
  });
  const saDyoPageData = await fetchData(window.location.origin + window.location.pathname, saDyoUuid);
  if (saDyoPageData) {
    intervalFunctionToRendermetaData(saDyoPageData);
    setTimeout(() => {
      clearInterval(intervalID);
    }, 30000);

    window.otto_js_installed = true;
    window.otto_js_uuid = saDyoUuid;
  }
  consolePrint('Script ended');
};

initializeScript();