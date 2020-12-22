// ==UserScript==
// @name           Open the F**king URL Right Now
// @description    自动跳转某些网站不希望用户直达的外链
// @author         OldPanda
// @match          http://t.cn/*
// @match          https://www.jianshu.com/go-wild?*
// @match          https://link.zhihu.com/?target=*
// @match          http://link.zhihu.com/?target=*
// @match          https://www.douban.com/link2/?url=*
// @match          https://link.ld246.com/forward?goto=*
// @match          https://mp.weixin.qq.com/*
// @match          http://redir.yy.duowan.com/warning.php?url=*
// @match          https://weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi*
// @match          https://link.csdn.net/?target=*
// @version        0.7.0
// @run-at         document-idle
// @namespace      https://old-panda.com/
// @require        https://cdn.bootcdn.net/ajax/libs/jquery/3.5.1/jquery.min.js
// @license        GPLv3 License
// ==/UserScript==

(function () {
  'use strict';

  function rstrip(str, regex) {
    let i = str.length - 1;
    while (i >= 0) {
      if (!str[i].match(regex)) {
        break;
      }
      i--;
    }
    return str.substring(0, i + 1);
  }

  /**
   * Split concatenated URL string into separate URLs.
   * @param {String} str
   */
  function splitMultiURLs(str) {
    let results = new Array();
    let entry = "";
    while (str.length > 0) {
      if (str.indexOf("http:") === -1 && str.indexOf("https:") === -1) {
        entry += str;
        str = "";
        results.push(rstrip(entry, /[@:%_\+~#?&=,$^\*]/g));
        break;
      }

      if (str.startsWith("http:")) {
        entry += "http:";
        str = str.substring("http:".length);
      } else if (str.startsWith("https:")) {
        entry += "https:";
        str = str.substring("https:".length);
      } else {
        return results;
      }

      let nextIndex = Math.min(
        str.indexOf("https:") === -1 ? Number.MAX_SAFE_INTEGER : str.indexOf("https:"),
        str.indexOf("http:") === -1 ? Number.MAX_SAFE_INTEGER : str.indexOf("http:")
      );
      if (nextIndex > 0) {
        entry += str.substring(0, nextIndex);
        str = str.substring(nextIndex);
      }
      results.push(rstrip(entry, /[@:%_\+~#?&=,$^\*]/g));
      entry = "";
    }
    return results;
  }

  /**
   * Replace url with clickable `<a>` tag in html content.
   * @param {String} url
   */
  function replaceSingleURL(url) {
    $("#js_content").html((_, html) => {
      return html.replace(url, `<a target="_blank" rel="noopener noreferrer" href="${url}">${url}</a>`);
    });
  }

  /**
   * Make urls clickable again on Weixin Media Platform.
   */
  function enableURLs() {
    let existingLinks = new Set();
    $("a").each(function () {
      existingLinks.add(this.href);
    });

    let content = $("#js_content").text();
    let urls = content.matchAll(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g);
    let replaced = new Set();
    for (let value of urls) {
      let urlStr = $.trim(value[0]);
      for (let url of splitMultiURLs(urlStr)) {
        if (!url || replaced.has(url) || url.includes("localhost") || url.includes("127.0.0.1") || existingLinks.has(url)) {
          continue;
        }
        if (url.endsWith(".") && url[url.length - 2].match(/\d/g)) {
          url = url.substring(0, url.length - 2);
        }
        replaceSingleURL(url);
        replaced.add(url);
      }
    }
  }

  function replaceWithTrueURL(fakeURLStr, trueURLParam) {
    let fakeURL = new URL(fakeURLStr);
    let trueURL = fakeURL.searchParams.get(trueURLParam);
    window.location.replace(trueURL);
  }

  $(document).ready(function () {
    if (window.location.href.includes("http://t.cn/")) {
      window.location.replace($(".wrap .link").first().text());
    } else if (window.location.href.includes("https://www.jianshu.com/go-wild?")) {
      replaceWithTrueURL(window.location.href, "url");
    } else if (window.location.href.includes("https://link.zhihu.com/?target=") || window.location.href.includes("http://link.zhihu.com/?target=")) {
      replaceWithTrueURL(window.location.href, "target");
    } else if (window.location.href.includes("https://www.douban.com/link2/?url=")) {
      replaceWithTrueURL(window.location.href, "url");
    } else if (window.location.href.includes("https://link.ld246.com/forward?goto=")) {
      replaceWithTrueURL(window.location.href, "goto");
    } else if (window.location.href.includes("https://mp.weixin.qq.com/")) {
      enableURLs();
    } else if (window.location.href.includes("http://redir.yy.duowan.com/warning.php?url=")) {
      replaceWithTrueURL(window.location.href, "url");
    } else if (window.location.href.includes("https://weixin110.qq.com/cgi-bin/mmspamsupport-bin/newredirectconfirmcgi")) {
      window.location.replace($(".weui-msg__desc").first().text());
    } else if (window.location.href.includes("https://link.csdn.net/?target=")) {
      replaceWithTrueURL(window.location.href, "target");
    }
  });
})();
