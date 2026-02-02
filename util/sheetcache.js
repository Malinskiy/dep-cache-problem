import PublicGoogleSheetsParser from 'public-google-sheets-parser';
import superagent from 'superagent';


class SheetCache {
  constructor(sheetId, formId) {
    this.sheetId = sheetId
    this.formId = formId
    this.parser = new PublicGoogleSheetsParser(sheetId)
  }

  async load() {
    console.log(`Loading sheet ${this.sheetId}`)
    return await this.parser.parse();
  }

  put(hash, tree, result) {
    var fields = {
      hash: 'entry.1819920154',
      tree: 'entry.285777555',
      result: 'entry.2099526473'
    }

    superagent.post(`https://docs.google.com/forms/d/e/${this.formId}/formResponse`)
      .type('form')
      .send({
        [fields.hash]: hash,
        [fields.tree]: JSON.stringify(tree),
        [fields.result]: result,
      })
      .end(function (err, res) {
        if (err || !res.ok) {
          console.error(err);
        } else {
          console.log(res.body);
        }
      });
  }
}

export {
  SheetCache
}
