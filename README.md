

Gitlab OAuth Proxy is an application/service which provides a way to easily connect your app with Gitlab through OAuth.


Basically, it add a http service app into your gitlab-proxy.yourappdomain.com, which you can redirect users to authenticate, and it starts the Gitlab.com (or another gitlab installation) signin flow.
This service will complete the oauth flow and will store the Gitlab Access Token Encrypted using Public/Private Key encryption using the keys you provide through environment variables.


Example using Docker
===

```bash
docker run --rm -e "BASE_DOMAIN=myapp.com" -e "GITLAB_PROXY_PRIVATE_KEY=" -e GITLAB_TARGET="gitlab.com" -e "GITLAB_PROXY_REDIRECT_URI=frontend.myapp.com/oauth_callback" abner/gitlab_oauth_proxy
```


Example using Docker-compose
===

**.env file**

```
BASE_DOMAIN=myapp.com
GITLAB_PROXY_PRIVATE_KEY=
GITLAB_PROXY_REDIRECT_URI=frontend.myapp.com/oauth_callback
GITlAB_CLIENT_ID=
GITlAB_CLIENT_SECRET=
GITLAB_TARGET_SERVICE=gitlab.com
```


**docker-compose.yml file**

```yaml
service:
  gitlab-oauth-proxy
    image: abner/gitlab-oauth-proxy
    env_file: gitlab-oauth-proxy.env
    ports:
      - 8080
 ... your other docker services here
```

Just start it using docker-compose:
----

```bash
docker-compose up -d
```

