import os
import boto
import boto.ec2
from boto.s3.connection import S3Connection
from boto.s3.key import Key
import string
from subprocess import call
from boto.sns import SNSConnection
import datetime


def cleanup():
  print("Cleaning up...")
  try:
    call(['rm', tarfile_name])
  except:
    print("No tarfile to remove")

  try:
    call(['rm', '-rf', backup_path])
  except:
    print("No raw backup to remove");

bucket_name = 'efins-dbbackups'
arn = "arn:aws:sns:us-west-2:196230260133:eFins_db_backup"

node_env = os.getenv('NODE_ENV')
if node_env == 'production':
  key_prefix = 'efins_dbbackups/production'
elif node_env == 'development':
  key_prefix = 'efins_dbbackups/development'
elif node_env == 'staging':
  key_prefix = 'efins_dbbackups/staging'
else:
  node_env = node_env if node_env else '-none-'
  print("NODE_ENV '" + node_env + "' is not valid.  Try setting it to one of {production, staging, development}.")
  exit(-1) 


# Get a SNS connection so we can report on our status
regions = boto.sns.regions()
myRegion = ''
for region in regions:
  print region
  if region.name == 'us-west-2':
    myRegion = region
sns = SNSConnection('AKIAIBYUXG6UOLBFSRKA', 'FvFbsW2C9rS9ayA1AHvHmBqL07iU+oz5X803xdot', region=myRegion)


# Take the DB backup
db_suffix = "_" + node_env if node_env in ["development", "staging"] else ""
db_name = "efins" + db_suffix
print("Starting the backup of " + db_name)
now = datetime.datetime.now()
backup_name = "%s_%s_%s_%s_%s_%s_%s" % (now.month, now.day, now.year, now.hour, now.minute, now.second, os.getenv('USER'))
print backup_name
backup_path = "/tmp/%s" % backup_name
print("Dumping to %s" % backup_path)


orig_dir = os.getcwd()
os.chdir('/tmp')
rc = call(['pg_dump', db_name, '-f', backup_path])
if rc != 0:
  sns.publish(arn, "eFins DB backup failed in pg_dump step.", subject="Database Backup Failure on %s" % node_env)
  cleanup()
  exit(-1)
tarfile_name = "%s.tgz" % backup_name
rc = call(['tar', 'cvfz', tarfile_name, backup_name])
if rc != 0:
  sns.publish(arn, "eFins DB backup failed in TGZ creation step.", subject="Database Backup Failure on %s" % node_env)
  cleanup()
  exit(-1)

print("Dumped.")


print("Uploading dump to S3...")
conn = S3Connection('AKIAIBYUXG6UOLBFSRKA', 'FvFbsW2C9rS9ayA1AHvHmBqL07iU+oz5X803xdot')
bucket = conn.get_bucket(bucket_name)
key = Key(bucket)
key.key = node_env + "/" + backup_name + ".tgz"
bytes_written = key.set_contents_from_filename(tarfile_name)
if bytes_written < 1:
  sns.publish(arn, "eFins DB backup S3 upload failed.", subject="Database Backup Failure on %s" % node_env)
  exit(-1)
print("Uploaded.")
cleanup()
os.chdir(orig_dir)
