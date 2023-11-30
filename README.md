This is an API for canyoneering routes from RopeWiki.

## Using the API

You can make HTTP requests to the API at `http://canyoneer--main.s3.us-west-1.amazonaws.com`.

The following endpoints are available:

- `/v2/index.json` - all routes as a [newline separated JSON](https://ndjson.org) file using the lightweight `IndexRouteV2` type
- `/v2/index.geojson` - all route geometries from the KML file as a [newline separated JSON](https://ndjson.org) file using the `GeoJSONRouteV2` type
- `/v2/details/{id}.json` - detailed data for a single route using the `RouteV2` type which includes the HTML description and all geometries from the KML file
- `/v2/tiles/{z}/{x}/{y}.pbf` - all route geometries from the KML as the `GeoJSONRouteV2` type formatted as [Vector Tiles](https://github.com/mapbox/vector-tile-spec/)
- `/v2/tiles/metadata.json` - a standard Tippecanoe metadata file that describes what's in the vector tiles and how they were generated
- `/v2/schemas/{type}.json` - JSON schemas for `IndexRouteV2`, `RouteV2`, and `GeoJSONRouteV2`

- `/v1/index.json` - all routes as a JSON array using the `RouteV1` type
- `/v1/schemas/{type}.json` - JSON schemas for `RouteV1`

# Getting Started

Install native dependencies

- [git](https://git-scm.com)
- [Node.js](https://nodejs.org/en) (>= v19)
- [yarn](https://yarnpkg.com/) (>= v1.22)
- pandoc (>= 3.x.x)
- [tippecanoe](https://github.com/mapbox/tippecanoe) (>= v1.36)

Clone this git repository

```
git clone git@github.com:lucaswoj/canyoneer.git
cd canyoneer
```

Install yarn dependencies

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

The scraper supports some command line flags. You can see all of them by running

```
yarn start --help
```
