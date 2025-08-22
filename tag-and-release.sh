#!/bin/bash

# Team Management System v1.1.0 - Git Tag and Release Script

set -e  # Exit on any error

VERSION="1.1.0"
RELEASE_NOTES="RELEASE-NOTES-v1.1.0.md"

echo "🏷️  Creating Git tag and release for Team Management System v${VERSION}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository. Please run from the project root."
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Please commit or stash them first."
    echo "Uncommitted files:"
    git status --porcelain
    exit 1
fi

# Ensure we're on the main/master branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" && "$CURRENT_BRANCH" != "master" ]]; then
    echo "⚠️  Current branch is '$CURRENT_BRANCH'. Consider switching to main/master for releases."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if tag already exists
if git tag -l | grep -q "^v${VERSION}$"; then
    echo "❌ Tag v${VERSION} already exists."
    echo "Existing tags:"
    git tag -l | grep -E "v[0-9]+\.[0-9]+\.[0-9]+" | tail -5
    exit 1
fi

# Create annotated tag with release notes
echo "📝 Creating annotated tag v${VERSION}..."
if [ -f "$RELEASE_NOTES" ]; then
    git tag -a "v${VERSION}" -F "$RELEASE_NOTES"
    echo "✅ Created tag v${VERSION} with release notes from $RELEASE_NOTES"
else
    git tag -a "v${VERSION}" -m "Release v${VERSION}

🚀 Team Management System v${VERSION}

Major Features:
- Historical capacity data extraction
- Excel export with custom date ranges  
- Multi-sheet professional reports
- Role-based access control for exports

Technical Improvements:
- New API endpoints for historical data
- ExcelJS integration
- Enhanced Dashboard functionality
- Multi-platform Docker images (AMD64 + ARM64)

This release is fully backward compatible with v1.0.0.

Docker Images:
- team-management-backend:${VERSION}
- team-management-frontend:${VERSION}
"
    echo "✅ Created tag v${VERSION} with default release message"
fi

# Show the created tag
echo ""
echo "🏷️  Tag created:"
git show v${VERSION} --no-patch --format="Tag: %D%nAuthor: %an <%ae>%nDate: %ad%nMessage:%n%n%B"

echo ""
echo "📋 Next steps:"
echo "1. Push the tag: git push origin v${VERSION}"
echo "2. Build and push Docker images: ./build-v1.1.sh"
echo "3. Create GitHub release (optional): gh release create v${VERSION} --notes-file ${RELEASE_NOTES}"
echo ""
echo "🐳 Docker build command:"
echo "   export DOCKER_USERNAME=your-username && ./build-v1.1.sh"