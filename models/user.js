"use strict";
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var absUrl = require('../absoluteUrl.js');
var emailer = require('../email.js');

var randomToken = function() {
  return crypto.randomBytes(20).toString('hex');
}

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    usn: {
      type: DataTypes.INTEGER,
      //allowNull: false,
      unique: true//,
      // validate: {
      //   notEmpty: true
      // }
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    hash: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        // bcrypt hashes are always 60 characters
        len: [60, 60]
      },
      // setting hash directly should result in an error.
      set: function setUserHash(v) {
        throw new Error("Do not set hash directly. Use User#setPassword");
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    approved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    secretToken: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: randomToken
    },
    emailConfirmed: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  }, {
    classMethods: {
      apiSetup: apiSetup,
      // cb - this was auto-generated. Not sure of its utility
      associate: function(models) {
        // associations can be defined here
        models.User.belongsToMany(models.Activity, {through: "Activity2User"});
        models.User.belongsToMany(models.PatrolLog, {through: "PatrolLog2User"});
        models.User.belongsTo(models.Agency);
      },
      register: function(opts, next) {
        if (!opts.password) {
          var err = new Error("Password Required");
          err.status = 400;
          next(err);
        } else {
          var user = this.build({
            email: opts.email,
            name: opts.name
          });
          user.setPassword(opts.password, function(err) {
            /* istanbul ignore if */
            if (err) {
              next(err);
            } else {
              user.save({logging: false}).done(function(err, user) {
                /* istanbul ignore if */
                if (err) {
                  next(err);
                } else {
                  notifyAdminsOfNewUser(user, function(err){
                    next(err, user);
                  });
                }
              })
            }
          });
        }
      }
    },
    instanceMethods: {
      setPassword: function setPassword(password, done) {
        bcrypt.hash(password, 12, (function(err, hash) {
          this.setDataValue('hash', hash);
          /* istanbul ignore else */
          if (done) { 
            done(err, hash); 
          };
        }).bind(this));
      },
      verifyPassword: function verifyPassword(password, done) {
        bcrypt.compare(password, this.hash, done);
      },
      approve: function approveUser(done) {
        this.approved = true;
        this.save().done(function(err, user) {
          /* istanbul ignore if */
          if (err) {
            next(err);
          } else {
            sendEmailConfirmationToUser(user, done);
          }
        });
      },
      resendConfirmationEmail: function resendConfirmationEmail(next) {
        if (this.approved) {
          sendEmailConfirmationToUser(this, next);
        } else {
          next(new Error("User not yet approved."));
        }
      },
      sendPasswordReset: function sendPasswordReset(next) {
        sendPasswordResetToUser(this, next);
      },
      isAllowed: function userIsAllowed() {
        return this.approved && this.emailConfirmed;
      },
      toJSON: function() {
        var json = this.get()
        delete json.hash
        delete json.secretToken
        delete json.emailConfirmed
        delete json.approved
        return json
      }
    }
  }, {
    paranoid: true
  });
  return User;
};

function notifyAdminsOfNewUser(user, next) {
  emailer.sendTemplates({
    to: emailer.adminEmail,
    subject: "New eFins user registration - " + user.name,
    html: 'email/newUserNotification',
    text: 'email/newUserNotificationText',
    context: {
      approve: absUrl("/auth/approve/", user.secretToken),
      deny: absUrl("/auth/deny/", user.secretToken),
      name: user.name,
      email: user.email
    }
  }, function(err, json) {
    next(err, user);
  });
}

function sendEmailConfirmationToUser(user, next) {
  emailer.sendTemplates({
    to: user.email,
    subject: "Confirm your eFins account",
    html: 'email/confirmEmail',
    text: 'email/confirmEmailText',
    context: {
      confirm: absUrl("/auth/emailConfirmation/", user.secretToken),
      name: user.name
    }
  }, function(err, json) {
    next(err, user);
  });
}

function sendPasswordResetToUser(user, next) {
  emailer.sendTemplates({
    to: user.email,
    subject: "Reset your eFins password",
    html: 'email/reset',
    text: 'email/resetText',
    context: {
      confirm: absUrl("/auth/resetPassword/", user.secretToken),
      name: user.name,
      admin: emailer.adminEmail
    }
  }, function(err, json) {
    next(err, user);
  });
}

function apiSetup() {
  return( {
    configHash: {
      endpoints: ['/user', '/user/:id'],
      actions: ['list', 'read']
    },
    customizationFunction: function(users) {
      users.use({});
      return;
    }
  });
}
