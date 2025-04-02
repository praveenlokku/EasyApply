import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.5 2h-15A2.5 2.5 0 002 4.5v15A2.5 2.5 0 004.5 22h15a2.5 2.5 0 002.5-2.5v-15A2.5 2.5 0 0019.5 2zm-4.7 15.5h-2.2v-3.9c0-.9-.3-1.5-1.2-1.5-.7 0-1.1.4-1.3.9-.1.1-.1.3-.1.6v4H7.8V9.4h2.2v1c.6-.7 1.4-1.2 2.5-1.2 1.8 0 3.2 1.2 3.2 3.7v5.6z"/>
              </svg>
              <span className="text-xl font-bold">ResumeMatch</span>
            </div>
            <p className="text-neutral-400 mb-6">
              Helping job seekers land their dream jobs with AI-powered resume optimization and job matching.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 5.5c-.8.4-1.6.6-2.5.8.9-.5 1.6-1.4 1.9-2.4-.8.5-1.8.9-2.7 1.1-.8-.9-1.9-1.4-3.2-1.4-2.4 0-4.3 1.9-4.3 4.3 0 .3 0 .7.1 1-3.6-.2-6.8-1.9-8.9-4.5-.4.6-.6 1.4-.6 2.2 0 1.5.8 2.8 1.9 3.6-.7 0-1.4-.2-1.9-.5v.1c0 2.1 1.5 3.8 3.4 4.2-.4.1-.7.2-1.1.2-.3 0-.5 0-.8-.1.5 1.7 2.1 2.9 3.9 3-1.4 1.1-3.2 1.8-5.1 1.8-.3 0-.7 0-1-.1 1.8 1.2 4 1.9 6.3 1.9 7.6 0 11.8-6.3 11.8-11.8v-.5c.8-.6 1.5-1.3 2-2.2z"></path>
                </svg>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5C3.895 3 3 3.895 3 5V19C3 20.105 3.895 21 5 21H19C20.105 21 21 20.105 21 19V5C21 3.895 20.105 3 19 3ZM9 17H6.477V10H9V17ZM7.694 8.717C6.923 8.717 6.408 8.203 6.408 7.517C6.408 6.831 6.922 6.317 7.779 6.317C8.55 6.317 9.065 6.831 9.065 7.517C9.065 8.203 8.551 8.717 7.694 8.717ZM18 17H15.558V13.344C15.558 12.297 15.001 11.999 14.654 11.999C14.308 11.999 13.248 12.154 13.248 13.344C13.248 13.498 13.248 17 13.248 17H10.805V10H13.248V10.956C13.589 10.301 14.323 10 15.305 10C16.287 10 18 10.611 18 13.208V17Z"></path>
                </svg>
              </a>
              <a href="#" className="text-neutral-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.0003 2.00092C6.47991 2.00092 2.00061 6.48022 2.00061 12.0006C2.00061 17.5209 6.47991 22.0002 12.0003 22.0002C17.5207 22.0002 22 17.5209 22 12.0006C22 6.48022 17.5207 2.00092 12.0003 2.00092ZM7.99811 15.5809C7.99598 15.584 7.99171 15.5809 7.99811 15.5809C7.64983 15.5809 7.31432 15.4405 7.07869 15.1999C6.83452 14.9539 6.70148 14.6218 6.70574 14.2732C6.70574 13.9297 6.84305 13.5966 7.08723 13.3529C7.325 13.1154 7.66264 12.9719 8.00878 12.9719C8.35492 12.9719 8.69682 13.1154 8.9346 13.3529C9.17663 13.5966 9.31394 13.9297 9.31394 14.2732C9.31394 14.6166 9.17663 14.9497 8.9346 15.1935C8.69682 15.4373 8.35705 15.5809 7.99811 15.5809ZM13.0356 17.9991C11.1235 17.9991 9.47455 16.8731 8.71882 15.2358C8.67243 15.1402 8.70388 15.0256 8.79241 14.9667L9.59107 14.4406C9.62893 14.4164 9.67318 14.4089 9.71529 14.4202C9.75527 14.4344 9.79099 14.4608 9.81602 14.499C10.337 15.3866 11.4629 16.0004 12.7311 16.0004C14.5067 16.0004 16.0003 14.5822 16.0003 12.9002C16.0003 11.2182 14.5067 9.80007 12.7311 9.80007C11.5138 9.80007 10.4134 10.3671 9.85699 11.2056C9.83197 11.2418 9.79626 11.2668 9.75614 11.2795C9.71317 11.2932 9.66892 11.2857 9.63106 11.2601L8.79241 10.7133C8.70388 10.6529 8.67029 10.5353 8.71882 10.4397C9.4767 8.83321 11.1171 7.7998 13.0356 7.7998C15.6692 7.7998 17.9996 10.0797 17.9996 13.0008C17.9996 15.9219 15.6692 17.9991 13.0356 17.9991Z"></path>
                </svg>
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="#features"><a className="text-neutral-400 hover:text-white transition-colors">Features</a></Link></li>
              <li><Link href="#how-it-works"><a className="text-neutral-400 hover:text-white transition-colors">How It Works</a></Link></li>
              <li><Link href="#pricing"><a className="text-neutral-400 hover:text-white transition-colors">Pricing</a></Link></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">FAQs</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Career Tips</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Resume Guides</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Interview Prep</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-neutral-400 hover:text-white transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-12 pt-8 text-center text-neutral-400 text-sm">
          <p>&copy; {new Date().getFullYear()} ResumeMatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
