var email = require('../email.js');
var MailClient = new require('sendgrid-stub').MailClient;
var client = new MailClient();

exports.emailMockWorks = function(test) {
  email.send({
    to: "user@example.com",
    from: email.adminEmail,
    subject: "only a test",
    text: "hello"
  }, function (err, json) {
    test.ifError(err);
    client.getLatest(function(err, mail) {
      var mail = JSON.parse(mail);
      test.ifError(err);
      test.equal(mail.from, email.adminEmail);
      test.ok(mail.from.length > 0);
      test.done();
    });
  });
}

exports.tearDown = function(done) {
  client.deleteAll(done);
}