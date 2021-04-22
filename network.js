var URLs = UI.panels.network._networkLogView._dataGrid._rootNode._flatNodes.map(
  n => n._request.,
);
copy(URLs.join('\n'));
await URLs;

function getOperationName() {
  let operationNames = [];
  let URLs = UI.panels.network._networkLogView._dataGrid._rootNode._flatNodes.map(
    n =>
      n._request._requestFormDataPromise.then(result =>
        operationNames.push(result),
      ),
  );
  console.log(URLs);
  console.log('operationNames: ', operationNames);
  return operationNames;
}

async function getNetWork() {
  const getContent = r =>
    r._url && !r._url.startsWith('data:') && r.contentData();
  const nodes =
    UI.panels.network._networkLogView._dataGrid._rootNode._flatNodes;
  const operations = [];
  const requests = nodes.map(n => n._request);
  const bowels = await Promise.all(requests.map(getContent));
  const looks = bowels.map((data, i) => {
    const r = requests[i];
    const url = r._url;
    let resolved = [];
    const operationName = r._requestFormDataPromise;
    if (operationName) {
        operationName.then(result => {
            if (typeof result === 'string') {
                resolved.push(result)
            }
        })
    }
    const content = !data
      ? 'data is encoded inside the data url already, duh'
      : r.contentType().isTextType()
      ? data.content
      : `Common.ContentProvider.contentAsDataURL(
        data.content,
        r.mimeType,
        data.encoded,
      )`;
    return { url, resolved, content };
  });

  return looks.filter(data => data.url.includes('gowid') && data.content);
}

const content = await getNetWork();
const keyword = '1520';
const searchResult = content.filter(data => data.content.includes(keyword));
const parsed = searchResult.map(data => {
    let content = JSON.parse(data.content);
    let resolved = JSON.parse(data.resolved[0]);

    return {url: data.url, resolved, content}
})
console.log(content.filter(data => data.content.includes(keyword)));

// promise 데이터를 꺼낼 방법이 필요하다.
// gowid.map(data => data.operationName.then(result => ops.push(result)))
