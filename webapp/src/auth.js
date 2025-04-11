import NextAuth from "next-auth"

function UAProvider(options) {
  return {
    id: "ua",
    name: "Universidade de Aveiro",
    type: "oidc",
    clientId: options.clientId,
    clientSecret: options.clientSecret,

	issuer: "https://wso2-is.ua.pt/oauth2/oidcdiscovery",
    
    authorization: {
      url: "https://wso2-gw.ua.pt/authorize",
      params: {
        scope: "openid",
        redirect_uri: "http://localhost:3000"
      }
    },    
    token: {
		url: "https://wso2-gw.ua.pt/token",
		params: {
			redirect_uri: "http://localhost:3000"
		}
	},
    userinfo: "https://wso2-gw.ua.pt/userinfo",
    
    profile(profile) {
      console.log("Profile from UA IdP:", profile);
      
      return {
        id: profile.sub || profile.id || "unknown",
        name: profile.name || profile.preferred_username || "",
        email: profile.email || "",
        image: profile.picture || null
      };
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    UAProvider({
      clientId: process.env.AUTH_UA_CLIENT_ID,
      clientSecret: process.env.AUTH_UA_CLIENT_SECRET,
    })
  ],
  pages: {
    signIn: '/en/login',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      // Make user information available on the client
      session.accessToken = token.accessToken;
      session.user = token.user || session.user;
      
      // Simply return the session - cookie handling moved to middleware
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith("/")) return new URL(url, baseUrl).toString();
      return baseUrl;
    }
  }
})