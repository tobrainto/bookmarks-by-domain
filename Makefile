current:
	$(eval tag := $(shell cat version | awk -F '-' '{print $$1}'))
	$(info will be release with tag ${tag})
	$(shell echo ${tag} > version)
	$(eval userName := $(shell git config user.name))
	$(eval branch := $(shell git branch | grep \* | awk '{print $$2}'))
	git commit -am "release $(tag) by ${userName}";git push origin HEAD
	git tag -a $(tag) -m "Branch: ${branch}";git push origin refs/tags/$(tag)

prepare:
	$(eval userName := $(shell git config user.name))
	$(eval next := $(shell awk -F "." '{print $$1"."$$2"."($$3+1)"-SNAPSHOT"}' version))
	$(info prepare for $(next) development iteration)
	$(shell echo ${next} > version)
	git commit -am "prepare for $(next) development iteration by ${userName}";git push origin HEAD

release: current prepare