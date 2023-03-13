doc_id =
  'AKfycbwnjeuB8mQKLXm9opklyTUhHssD7LKf75MAB8TsK63TxM4CAI4m89nMYih4qB_vd54_rQ';

function buildGemelnetURL(id) {
  link =
    'https://gemelnet.cma.gov.il/views/perutHodshi.aspx?idGuf=' +
    id.toString() +
    '&OCHLUSIYA=1';
  return link;
}

/****************************************************************************************/
function buildGoogleURL(doc_id) {
  google_url = 'https://script.google.com/macros/s/' + doc_id + '/exec';
  return google_url;
}
/****************************************************************************************/
function openGufPage(id) {
  return open(buildGemelnetURL(id));
}

function openGufsPages(ids = []) {
  idsSet = [...new Set(ids)];
  idsSet.map(id => {
    open(buildGemelnetURL(id));
  });
}
/****************************************************************************************/
function getID(page = window) {
  idGuf = page.theForm.elements['tbIdGuf'].value;
  return idGuf;
}

idGuf = getID();
/****************************************************************************************/
function getTableContent(index, page = window) {
  let table_content =
    page.document.all.VisibleReportContentReportViewer1_ctl10.getElementsByTagName(
      'table'
    )[index].innerText;
  arr1 = table_content.split('\n\n').map(a => a.trim()/*.replaceAll(',', ' ')*/);
  arr2 = arr1.map(a => a.split('\n\t\n'));
  arr = arr2.map(a => a.reverse());
  return arr;
}
/****************************************************************************************/
function getTables(page = window) {
  let all_tabels =
    page.document.all.VisibleReportContentReportViewer1_ctl10.getElementsByTagName(
      'table'
    );
  let tables_set = new Set();
  for (i = 0; i < all_tabels.length; i++) {
    current_table = getTableContent(i);
    if (
      all_tabels[i].innerText.includes('באחוזים') &&
      current_table.length < 98
    ) {
      let current_table_text = table_to_text(current_table);
      tables_set.add(current_table_text.replaceAll('\\"', '"'));
    }
  }
  tables_array = Array.from(tables_set);
  return tables_array;
}
/****************************************************************************************/
/*Get Only Tables with given text*/
//ToDo: Replace All ocurances of getTables() with this function
function getTablesWithText(page = window, text_to_find) {
  let all_tabels =
    page.document.all.VisibleReportContentReportViewer1_ctl10.getElementsByTagName(
      'table'
    );
  let tables_set = new Set();
  for (i = 0; i < all_tabels.length; i++) {
    current_table = getTableContent(i);
    if (
      all_tabels[i].innerText.includes(text_to_find) &&
      current_table.length < 98
    ) {
      let current_table_text = table_to_text(current_table).trim();
      tables_set.add(current_table_text.replaceAll('%', ''));
    }
  }
  tables_array = Array.from(tables_set);
  return tables_array;
}
/****************************************************************************************/
function table_to_text(source_table) {
  table_text = source_table.map(colmns => colmns.join('\t')).join('\n');
  //table_text = table_text.replaceAll('"','\"')
  return table_text;
}
/****************************************************************************************/
//ToDo: name this function acording to the one above
function table_from_table_text(table_text) {
  rows = table_text.split('\n');
  cols = rows.map(a => a.split('\t'));
  return cols;
}
/****************************************************************************************/
function exctract_percents_tables(index = 'all', page = window) {
  page_tables =
    page.document.all.VisibleReportContentReportViewer1_ctl10.getElementsByTagName(
      'table'
    );
  a = getTablesWithText(window, 'אחוזים').filter(t => !t.match('פקס')); //.map(a=>a[0].split(/'סה"כ'/))
  ct = a[0].split('סה"כ');
  categories_table = ct[0].trim()
    .replace(/\n+באחוזים/, ' באחוזים')
    .replace(/\t\t\n\n/, '')
    
  delta_table = a[1]
    .replace(/\n+באחוזים/, ' באחוזים')
    .replace(', ','')
    .replace("למניות","למניות במונחי דלתא");

  switch (index) {
    case 0:
    case 'categories':      {        t = categories_table      }
      break;
    case 1:
    case 'delta':      {        t = delta_table      }
      break;
    default: {      t = getCombinedTables2()    }
  }
  //copy(t)
  return t.toString();
}
/****************************************************************************************/
function butify_table2(table_text) {
  arr1 = table_text.split('\n\n').map(a => a.trim());
  arr2 = arr1.map(a => a.split('\n\t\n'));
  arr = arr2.map(a => a.reverse()).filter(r => r.length > 1);
  return arr;
}

function butify_table(table_text) {
  arr1 = table_text.split('\n').map(a => a.trim());
  arr2 = arr1.map(a => a.split('\t'));
  arr = arr2.map(a => a.reverse()).filter(r => r.length > 1);
  // table(arr)
  return arr;
}
/****************************************************************************************/
function sumArraysByElements(array1, array2) {
  var sum = array1.map(function (num, idx) {
    return (num + array2[idx]).toFixed(2);
  });
  return sum;
}
/****************************************************************************************/
function sendToSheets(idGuf, table_text, dest = 'categories') {
  base_url = buildGoogleURL(doc_id);
  //url = base_url+'?idGuf='+idGuf+"&table="+encodeURI(table_text)
  url = encodeURI(
    base_url + '?idGuf=' + dest + '_' + idGuf + '&table=' + table_text
  );
  console.log(url.replace('exec', 'dev'));
  fetch(url, {
    method: 'post',
    mode: 'no-cors',
  });
}

function transpose(matrix) {
  const rows = matrix.length,
    cols = matrix[0].length;
  const grid = [];
  for (let j = 0; j < cols; j++) {
    grid[j] = Array(rows);
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      grid[j][i] = matrix[i][j];
    }
  }

  return grid;
}

function getCombinedTables() {
  let ct1 = butify_table(exctract_percents_tables('categories'));
  let dtr = butify_table(exctract_percents_tables('delta'))[1];
  ct1.splice(ct1.length, 0, dtr);
  return ct1;
}

/****************************************************************************************/
//ToDo: impliment it inside the get table function?
function buildConcernsArray(test_table = combineTables2()) {
  let columns = test_table[0].length - 1;
  concerns_arrays = test_table.filter(row => !!row[columns].match(/קונצרני/));
  concerns_arrays = concerns_arrays.map(row => row.splice(0, row.length));
  concerns_arrays = concerns_arrays.map(row =>
    row.map(cell => Number(cell.replaceAll(/\%/g, '')))
  );
  percentages = sumArraysByElements(concerns_arrays[0], concerns_arrays[1]); //.map(cell => cell+"%")
  arr = ['אג"ח קונצרני'];
  percentages.pop();
  percentages.push(arr);
  return percentages.flat(1);
}

function add_concerne_array_to_combined_table(test_table = combineTables2()) {
  concern_array = buildConcernsArray();
  let columns = test_table[0].length - 1;
  filtered_table = test_table.filter(row => !row[columns].match(/קונצרני/));
  filtered_table.splice(3, 0, concern_array);
  return filtered_table;
}

function send_combined_table_to_sheets() {
  sendToSheets(
    idGuf,
    table_to_text(makeFinalTable()),//table_to_text(add_cashflow_array_to_combined_table(add_concerne_array_to_combined_table())),
    'All'
  );
  //copy(table_to_text(add_concerne_array_to_combined_table()))
}

function getRowByHeader(source_table, header) {
  let columns = source_table[0].length - 1;
  return source_table.filter(row => row[columns].match(header));
}

function removeColumnByHeader(arr, header = '') {
  const headerIndex = arr[0].indexOf(header);
  if (headerIndex === -1) {
    altered_table = arr; /* Header not found, nothing to remove */
  } else {
    altered_table = arr.map(row => row.filter((_, i) => i !== headerIndex));
  }
  return altered_table;
}

function get_missing_year() {
  categories_titles = butify_table(exctract_percents_tables('categories'))[0];
  delta_titles = butify_table(exctract_percents_tables('delta'))[0];
  delta_titles.push('שם הנכס');

  filteredArray = categories_titles.filter(
    element => !delta_titles.includes(element)
  );
  return filteredArray.join('');
}

function combineTables2() {
  categories = butify_table(exctract_percents_tables('categories'));
  delta_table = butify_table(exctract_percents_tables('delta'));
  data_to_push = getRowByHeader(delta_table, 'מניות');
  altered_categories_table = removeColumnByHeader(
    categories,
    get_missing_year()
  );
  combined_tables = altered_categories_table.concat(data_to_push);
  //table(combined_tables)
  return combined_tables;
}

//Make a function that accept strings and a table and combine the raws containing the straing
function buildCashFlowArray(titles=["מזומנים ושווי מזומנים","פיקדונות"], test_table = combineTables2()) {
  let columns = test_table[0].length - 1;
  cash_flow_arrays = test_table.filter(row => !!row[columns].match(convertToRegex(titles)));
  cash_flow_arrays = cash_flow_arrays.map(row => row.splice(0, row.length));
  cash_flow_arrays = cash_flow_arrays.map(row =>
    row.map(cell => Number(cell.replaceAll(/\%/g, '')))
  );
  percentages = sumArraysByElements(cash_flow_arrays[0], cash_flow_arrays[1]); //.map(cell => cell+"%")
  arr = [titles[0]+" + "+titles[1]];
  percentages.pop();
  percentages.push(arr);
  return percentages.flat(1);
}

function add_cashflow_array_to_combined_table(test_table = combineTables2()) {
  cash_flow_array = buildCashFlowArray();
  //test_table = combineTables2();
  let columns = test_table[0].length - 1;
  filtered_table = test_table.filter(row => !row[columns].match(/(מזומנים ושווי מזומנים)|(פיקדונות)/));
  filtered_table.splice(3, 0, cash_flow_array);
  return filtered_table;
}

//ToDo: Use this instead of the function that removes one if possible
function removeRowsByHeaders(source_table, titles=[]) {
  let columns = source_table[0].length - 1;
  return source_table.filter(row => !row[columns].match(convertToRegex(titles)))
}


//ToDo: Use this instead of the function that gets one if possible
function getRowsByHeaders(source_table, titles=[]) {
  let columns = source_table[0].length - 1;
  return source_table.filter(row => !!row[columns].match(convertToRegex(titles)))
}

function convertToRegex(strings=[]){
let pattern = "("+strings.join(")|(")+")"
let regexp = new RegExp(pattern,"g")
return(regexp)
}

//For Multiple Arrays
//ToDo: use it for all combinations functions
function sumArraysByElements2(arrays) {
const maxLength = Math.max(...arrays.map((arr) => arr.length));
  const result = [];
  for (let i = 0; i < maxLength; i++) {
    const elements = [];
    const strings = [];
    for (let j = 0; j < arrays.length; j++) {
      const element = arrays[j][i];
      if (isNaN(parseFloat(element))) {
        strings.push(element);
      } else if (!isNaN(element)) {
        elements.push(parseFloat(element));
      }
    }
    const sum = elements.reduce((acc, curr) => acc + curr, 0);
    if (strings.length > 0) {
      result.push(
        strings.join(", ")
      );
    } else {
      result.push(sum.toFixed(2));
    }
  }
  return result;
}

function makeFinalTable(){
titles = ["נכסים אחרים","הלוואות","קרנות נאמנות"]
combined_table = combineTables2()

arrays = getRowsByHeaders(combined_table, titles)
sum_array = sumArraysByElements2(arrays)
new_table = removeRowsByHeaders(combined_table, titles)
new_table.splice(3, 0, sum_array);
final_table = add_concerne_array_to_combined_table(new_table)
final_table = add_cashflow_array_to_combined_table(final_table)
return final_table
}

/****************************************************************************************************/

function buildGemelnetDataURL(resource_id="a30dcbea-a1d2-482c-ae29-8f781f5025fb",guf_id=getID()){
    return("https://data.gov.il/api/3/action/datastore_search?resource_id="+resource_id+"&q="+guf_id)
}

function fetchGemelnetDataURL(){
fetch(buildGemelnetDataURL())
  .then((response) => response.json())
  .then((data) => (records = data.result.records));
    return(records)
}

function getAnualYields(){
    data = fetchGemelnetDataURL()
    yields = []
    yields.push(data[0]["YEAR_TO_DATE_YIELD"]);
    yields.push(data[0]['AVG_ANNUAL_YIELD_TRAILING_3YRS']);
    yields.push(data[0]['AVG_ANNUAL_YIELD_TRAILING_5YRS']);
            
    return(yields)
}
