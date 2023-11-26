# Getting Started

Install [git](https://git-scm.com), [Node.js](https://nodejs.org/en) (>= v19)
and [yarn](https://yarnpkg.com/) (>= v1.22)

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

The scraper supports some command line flags. You can see all of them by running

```
yarn start --help
```

## Output Products

- `index.json` - all routes as a newline separated JSON file using the `IndexRouteV2` type
- `index.geojson` - all route geometries from the KML file as a newline separated JSON file using the `GeoJSONRouteV2` type
- `details/{id}.json` - detailed data for a single route using the `RouteV2` type which includes the HTML description and all geometries from the KML file
- `tiles/{z}/{x}/{y}.pbf` - all route geometries from the KML as the `GeoJSONRouteV2` type formatted as [Vector Tiles](https://github.com/mapbox/vector-tile-spec/)
- `tiles/metadata.json` - a standard Tippecanoe metadata file that describes what's in the vector tiles and how they were generated
- `schema/{type}.json` - JSON schemas for RouteV1, IndexRouteV2, RouteV2, RouteV2GeoJSONFeature
- `legacy.json` - all routes as a JSON array using the `RouteV1` type
