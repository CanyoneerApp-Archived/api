# Getting Started

Install [git](https://git-scm.com), [Node.js](https://nodejs.org/en) (>= v19)
[yarn](https://yarnpkg.com/) (>= v1.22), and pandoc (>= 0.3.0)

Clone this git repository

```
git clone git@github.com:lucaswoj/canyoneer.git
cd canyoneer
```

Install all dependencies

```
yarn
```

Install the git pre-commit hook

```
yarn install-precommit
```

[Ask existing user to create an AWS account for you](https://us-east-1.console.aws.amazon.com/singlesignon/home?region=us-east-1&userCreationOrigin=IAM#!/instances/72232ee7076fe391/users)

[Install the AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

[Create an AWS access key](https://us-east-1.console.aws.amazon.com/iam/home#/security_credentials) ([docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey))

Authenticate the AWS CLI

```
$ aws configure --profile canyoneer

AWS Access Key ID [None]: {COPY FROM PREVIOUS STEP}
AWS Secret Access Key [None]: {COPY FROM PREVIOUS STEP}
Default region name [None]:
Default output format [None]:
```

Run the scraper

```
yarn start
```
