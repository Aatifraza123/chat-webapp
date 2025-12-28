import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageSquare, ArrowRight, Sparkles, Shield, Zap, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate('/chat');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">ChatFlow</span>
          </div>
          
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            ) : user ? (
              <Button onClick={() => navigate('/chat')}>
                Open Chat
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth')}>
                  Sign in
                </Button>
                <Button onClick={() => navigate('/auth')}>
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Real-time messaging made simple
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Connect with anyone,{' '}
            <span className="text-primary">anywhere</span>
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience seamless real-time communication with ChatFlow. 
            Beautiful design, instant messaging, and powerful features to keep you connected.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="w-full sm:w-auto">
              {user ? 'Open Chat' : 'Start Chatting Free'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose ChatFlow?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Built with modern technology for the best messaging experience
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="p-6 rounded-2xl bg-card border border-border text-center animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Messages delivered instantly with real-time sync across all your devices.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border text-center animate-fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your conversations are protected with industry-standard encryption.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-card border border-border text-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-muted-foreground">
              Clean, intuitive interface that makes chatting a pleasure.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary-foreground blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
              Ready to start chatting?
            </h2>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
              Join thousands of users who trust ChatFlow for their daily conversations.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={handleGetStarted}
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              {user ? 'Open Chat' : 'Get Started for Free'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2024 ChatFlow. Built with Lovable.</p>
        </div>
      </footer>
    </div>
  );
}
