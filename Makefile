# ==============================================================================
# downstream_template.mk — Downstream Makefile for makelib-node
# ==============================================================================
# Copy this file to your repository root as `Makefile`.
# It provides zero-copy inclusion of makelib-node toolchain and quality gates.
# ==============================================================================

# Makelib repository settings (override if using a fork or internal mirror)
MAKELIB_REPO ?= https://github.com/sudo-krish/makelib-node.git
MAKELIB_DIR  ?= .makelib
# ------------------------------------------------------------------------------
# Downstream Overrides (uncomment and adjust as needed)
# ------------------------------------------------------------------------------
# SRC_DIR      ?= src
# TEST_DIR     ?= test
# MIN_COVERAGE ?= 80

# ------------------------------------------------------------------------------
# Bootstrap Targets (available even before makelib is fetched)
# ------------------------------------------------------------------------------
.PHONY: init init-makelib update update-makelib

init: init-makelib
update: update-makelib

init-makelib: ## Initialize makelib as a submodule, install toolchain, and set up git hooks
	@if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then \
		echo "Initializing Git repository..."; \
		git init; \
	fi
	@if [ ! -e "$(MAKELIB_DIR)/.git" ]; then \
		if git config --file .gitmodules --get "submodule.$(MAKELIB_DIR).url" >/dev/null 2>&1; then \
			echo "Initializing existing submodule in $(MAKELIB_DIR)..."; \
			git -c protocol.file.allow=always submodule update --init --recursive $(MAKELIB_DIR) || \
			git -c protocol.file.allow=always submodule add --force $(MAKELIB_REPO) $(MAKELIB_DIR); \
		else \
			echo "Adding makelib-node submodule into $(MAKELIB_DIR)..."; \
			git -c protocol.file.allow=always submodule add --force $(MAKELIB_REPO) $(MAKELIB_DIR); \
		fi; \
	else \
		echo "Submodule $(MAKELIB_DIR) already present. Updating..."; \
		git -c protocol.file.allow=always submodule update --init --recursive $(MAKELIB_DIR); \
	fi
	@echo "Installing isolated makelib toolchain in $(MAKELIB_DIR)..."
	@npm --prefix "$(MAKELIB_DIR)" install
	@if [ -f "$(MAKELIB_DIR)/scripts/install-hooks.sh" ]; then \
		bash "$(MAKELIB_DIR)/scripts/install-hooks.sh"; \
	fi
	@echo "makelib-node initialized successfully! Run 'make check-all' or 'make help'."

update-makelib: ## Update makelib submodule to latest remote revision
	@echo "Updating makelib-node submodule in $(MAKELIB_DIR)..."
	@git -c protocol.file.allow=always submodule update --remote --merge $(MAKELIB_DIR)
	@npm --prefix "$(MAKELIB_DIR)" install
	@echo "makelib-node updated successfully."

# Include makelib core library
-include $(MAKELIB_DIR)/core.mk

# If makelib is not yet initialized and user runs another target, auto-initialize
ifeq ($(wildcard $(MAKELIB_DIR)/core.mk),)
.DEFAULT_GOAL := help-uninitialized

help-uninitialized:
	@echo "makelib-node is not initialized in '$(MAKELIB_DIR)'."
	@echo "Run 'make init' to automatically add the submodule and configure the toolchain."

%:
	@echo "makelib-node is not initialized in '$(MAKELIB_DIR)'. Auto-initializing..."
	@$(MAKE) init
	@$(MAKE) $@
endif

# ------------------------------------------------------------------------------
# Downstream Application Overrides & Targets
# ------------------------------------------------------------------------------
build: clean ## Compile production bundle for web application (Vite)
	@echo "Compiling production bundle with Vite..."
	@npm run build

dev: ## Start Vite development server
	@npm run dev

pages-dev: ## Run local Cloudflare Pages environment
	@npm run pages:dev

# ------------------------------------------------------------------------------
# Cloudflare & Deployment Targets
# ------------------------------------------------------------------------------
PROJECT_NAME ?= personal-fitness-tracker

db-setup: ## Provision Cloudflare D1 database and apply remote migrations
	@echo "Provisioning D1 database and applying remote migrations..."
	@node scripts/setup-d1-ci.js

deploy: build ## Build production assets and deploy to Cloudflare Pages
	@echo "Deploying production bundle to Cloudflare Pages ($(PROJECT_NAME))..."
	@npx wrangler pages deploy $(DIST_DIR) --project-name=$(PROJECT_NAME)

