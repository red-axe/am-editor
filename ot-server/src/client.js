const ShareDB = require('sharedb');
const { v3 } = require('uuid');
const Doc = require('./doc');

class Client {
  constructor(backend = new ShareDB()) {
    this.docs = [];
    this.backend = backend;
  }

  add(ws, docId, member) {
    if (!member.uuid) {
      member.uuid = v3(docId.toString().concat('/' + member.id), v3.URL);
    }
    let doc = this.docs.find(doc => doc.id === docId);
    if (!doc) {
      doc = new Doc(docId, this.backend, () => {
        //注销
        const index = this.docs.findIndex(doc => doc.id === docId);
        if (index > -1) {
          this.docs.splice(index, 1);
        }
      });
      this.docs.push(doc);
      //创建
      doc.create();
    } else {
      // 如果用户之前有连接到，那么就会移除之前的连接
      doc.removeMember(member.uuid);
    }
    // 增加用户到文档中
    doc.addMember(ws, member);
  }
}

module.exports = Client;
