FROM quay.io/redhat-certification/chart-verifier:1.2.3

# Install from EPEL - no longer used, since it's slower.

# RUN rpm -ivh https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm \
#     && microdnf -y install jq \
#     && microdnf clean all \
#     && rm -rf /var/cache/dnf

RUN curl -sSLfO https://github.com/stedolan/jq/releases/download/jq-1.6/jq-linux64 \
    && chmod 755 jq-linux64 \
    && mv -v jq-linux64 /usr/local/bin/jq \
    && jq --version

# https://github.com/redhat-certification/chart-verifier/issues/205
RUN ln -s /app/chart-verifier /usr/local/bin/chart-verifier

COPY ./entrypoint.sh /

RUN chmod 755 /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
