#define FW_VERSION "70p"
#define INNER_VERSION "elec+HB"

static const char *signPub = R"PUBKEY(
-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAzIKxDcOqhSHgx+OoTOnj
SEg/5mNRWccxO4Vfr7ZM+y2jkhEDcKCR09jcWuePngcRW/R97PYJ/fmpFJ+vsT0w
am+seSu00RkqIRZz78hmpW3B1bEcH9mvPi/slk1UftXADa2QQr7fTnlMmxXpvsdE
RDZ0FKbMEt5J9ZsnKLVrXruSw4+ZKv6t9uia8/84yCg081l4SYI8BdNqigBBBHeA
EO0qiwbaqUB9EmVbGPkvxO6aZGeQgEG3vwIqSya9ut56SIrjgq89Cntk8SBejtW7
uRqcs2V8igHlAOuRPgsUth+5sYNUCn/iWfRf+7NR5LausgTQ/O3ANfHRLHd+pkdn
n5fXAui2vzb453RtVksxviCQeW2Xdlbb2Amfq75+gRn6CRax21gYmqr2Ky5Z3u07
sUppkkY+lZKDqecsSkUJoylSxR+5gilJ48sD2R5FbpGOTLO/+Wt2q9Jv1jUx6Pv2
LwEmd36SWpozLcFHjs5wI1psc/XKMNy0/Dz/I3YJHfGrIK1iRsdHytakXZrEtAW2
DLckXSzeR2PBzF4W80d7jrzswx8G6yYiXXFCWVYhaZNUr0cZW2BIloyvDigCtXJ9
xtEO1j7Gm1NI0nhseODDh9ZIaeUEUgX+/skV8TJJQpxevcO55J+3jAaRPCD7hbbc
FbIm/Kvds8on5aDSnbazKVcCAwEAAQ==
-----END PUBLIC KEY-----
)PUBKEY";

static CryptoMemAsset *RSASign = new CryptoMemAsset("RSA Key", signPub, strlen(signPub) + 1);
