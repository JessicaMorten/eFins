"use strict";

var SendGrid;
var sendgrid;

/* istanbul ignore else */
if (process.env.NODE_ENV === 'test') {
  SendGrid = require('sendgrid-stub');
  sendgrid = new SendGrid.SendGrid(null, null, true);
  /* istanbul ignore next */
  sendgrid.adminEmail =
    process.env.EFINS_ADMIN_EMAIL || "admin@example.com";
  sendgrid.doNotReplyEmail =
    process.env.EFINS_NOREPLY_EMAIL || "do-not-reply@efins.org";
} else {
  SendGrid = require('sendgrid');
  if (!process.env.EFINS_SENDGRID_USER ||
    !process.env.EFINS_SENDGRID_PASSWORD) {
      console.error(
        "EFINS_SENDGRID_USER and EFINS_SENDGRID_PASSWORD must be set!")
  }
  sendgrid = new SendGrid(process.env.EFINS_SENDGRID_USER,
    process.env.EFINS_SENDGRID_PASSWORD);
  if (!process.env.EFINS_ADMIN_EMAIL) {
    console.error("EFINS_ADMIN_EMAIL must be set");
  }
  sendgrid.adminEmail = process.env.EFINS_ADMIN_EMAIL;
  sendgrid.doNotReplyEmail =
    process.env.EFINS_NOREPLY_EMAIL || "do-not-reply@efins.org";
}

sendgrid.sendTemplates = function sendTemplates(opts, next) {
  var app = require('./app');
  opts.from = opts.from || sendgrid.doNotReplyEmail;
  app.render(opts.html, opts.context, function(err, html) {
    /* istanbul ignore if */
    if (err) {
      next(err);
    } else {
      opts.html = html;
      app.render(opts.text, opts.context, function(err, text) {
        /* istanbul ignore if */
        if (err) {
          next(err);
        } else {
          opts.text = text;
          sendgrid.send(opts, next);
        }
      });
    }
  });
};

module.exports = sendgrid;
