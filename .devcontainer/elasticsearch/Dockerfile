ARG VARIANT="8.8.0"
FROM elasticsearch:${VARIANT}
RUN bin/elasticsearch-plugin install analysis-icu
RUN bin/elasticsearch-plugin install analysis-kuromoji
