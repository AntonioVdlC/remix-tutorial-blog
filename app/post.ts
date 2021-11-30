import path from "path";
import fs from "fs/promises";
import parseFrontMatter from "front-matter";
import invariant from "tiny-invariant";
import { marked } from "marked";

export type Post = {
  slug: String;
  title: String;
};

export type PostMarkdownAttributes = {
  title: String;
};

let postsPath = path.join(__dirname, "..", "posts");

function isValidPostAttributes(
  attributes: any
): attributes is PostMarkdownAttributes {
  return attributes?.title;
}

export async function getPosts() {
  let dir = await fs.readdir(postsPath);
  return Promise.all(
    dir.map(async (filename) => {
      let file = await fs.readFile(path.join(postsPath, filename));
      let { attributes } = parseFrontMatter(file.toString());

      invariant(
        isValidPostAttributes(attributes),
        `${filename} has bad metadata`
      );

      return {
        slug: filename.replace(/\.md$/, ""),
        title: attributes.title,
      };
    })
  );
}

export async function getPost(slug: string) {
  let filepath = path.join(postsPath, slug + ".md");
  let file = await fs.readFile(filepath);
  let { attributes, body } = parseFrontMatter(file.toString());

  invariant(
    isValidPostAttributes(attributes),
    `Post ${filepath} is missing attributes`
  );

  return {
    slug,
    title: attributes.title,
    html: marked(body),
  };
}

type NewPost = {
  slug: string;
  title: string;
  markdown: string;
};

export async function createPost(post: NewPost) {
  let md = `---\ntitle: ${post.title}\n---\n\n${post.markdown}`;
  await fs.writeFile(path.join(postsPath, post.slug + ".md"), md);

  return getPost(post.slug);
}
