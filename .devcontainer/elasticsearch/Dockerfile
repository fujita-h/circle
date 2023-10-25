ARG VARIANT="8.10.2"
FROM elasticsearch:${VARIANT}
RUN bin/elasticsearch-plugin install analysis-icu
RUN bin/elasticsearch-plugin install analysis-kuromoji
