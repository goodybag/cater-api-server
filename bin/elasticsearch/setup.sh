#!/bin/bash
./bin/elasticsearch/delete-cater-index
./bin/elasticsearch/mapping-restaurants
./bin/elasticsearch/create-river