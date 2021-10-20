FROM quay.io/redhat-certification/chart-verifier:1.2.3

RUN ln -s /app/chart-verifier /usr/local/bin/chart-verifier

# RUN rpm -ivh https://dl.fedoraproject.org/pub/epel/epel-release-latest-8.noarch.rpm \
#     && microdnf -y install jq \
#     && microdnf clean all \
#     && rm -rf /var/cache/dnf

RUN curl -sSLfO https://stedolan.github.io/jq/download/linux64/jq \
    && chmod 755 jq \
    && mv -v jq /usr/local/bin/ \
    && jq --version

COPY ./entrypoint.sh /

RUN chmod 755 /entrypoint.sh

ENTRYPOINT [ "/entrypoint.sh" ]
